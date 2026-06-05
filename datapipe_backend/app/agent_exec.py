"""
Server-side execution of agent actions.

The web chat confirms then calls REST endpoints; the Telegram bot has no browser,
so it executes here directly against the DB, then publishes a real-time event so
any open web editor redraws live. One vocabulary of actions, two front-ends.
"""
import io
import os

from datetime import datetime

from .extensions import db
from .models import (User, OrgMember, Workspace, Pipeline, Node, Edge, File)
from . import realtime


# ── Types de nœuds : canon + alias (durcit la planification de l'agent) ───────
# Tous les types exécutés par le moteur (+ table_preview/chart côté front).
CANONICAL_NODE_TYPES = {
    'csv_reader', 'json_reader', 'sql_query', 'http_request',
    'filter', 'map', 'aggregate', 'join', 'sort', 'dedup', 'sql_transform',
    'validate', 'split', 'merge',
    'mask_pii', 'detect_anomalies', 'quality_report', 'ai_transform',
    'file_export', 'sql_write', 'chart', 'table_preview',
    'notification_send', 'webhook_send', 'schedule_trigger',
}

# Synonymes -> type canonique. Matching par sous-chaîne (1er match, ordre = priorité).
NODE_TYPE_ALIASES = {
    # Sorties spécifiques d'abord (pour primer sur des mots génériques)
    'sql_write': 'sql_write', 'sql write': 'sql_write', 'écrit en base': 'sql_write',
    'ecrit en base': 'sql_write', 'écriture sql': 'sql_write', 'write': 'sql_write',
    'webhook': 'webhook_send',
    'notif': 'notification_send', 'notification': 'notification_send', 'notifie': 'notification_send',
    'chart': 'chart', 'graphique': 'chart', 'graph': 'chart', 'diagramme': 'chart', 'camembert': 'chart', 'courbe': 'chart',
    'aperçu': 'table_preview', 'apercu': 'table_preview', 'prévisualis': 'table_preview', 'previsualis': 'table_preview', 'table_preview': 'table_preview',
    'export': 'file_export', 'sortie': 'file_export', 'télécharge': 'file_export', 'download': 'file_export', 'csv export': 'file_export',
    # Entrées
    'http': 'http_request', 'requête http': 'http_request', 'requete http': 'http_request', 'appel api': 'http_request', 'api request': 'http_request',
    'json': 'json_reader',
    'sql_query': 'sql_query', 'requête sql': 'sql_query', 'requete sql': 'sql_query', 'query': 'sql_query',
    'csv': 'csv_reader', 'source': 'csv_reader', 'fichier': 'csv_reader',
    'import': 'csv_reader', 'transaction': 'csv_reader', 'lecture': 'csv_reader',
    # Transformations
    'sql_transform': 'sql_transform', 'transformation sql': 'sql_transform',
    'filtre': 'filter', 'filter': 'filter', 'where': 'filter',
    'mappage': 'map', 'renomme': 'map', 'rename': 'map', 'map': 'map',
    'agrég': 'aggregate', 'agreg': 'aggregate', 'aggreg': 'aggregate', 'groupe': 'aggregate',
    'group': 'aggregate', 'somme': 'aggregate', 'total': 'aggregate', 'moyenne': 'aggregate',
    'jointure': 'join', 'join': 'join',
    'merge': 'merge', 'concatèn': 'merge', 'concaten': 'merge', 'union': 'merge', 'combine': 'merge', 'fusionne': 'merge',
    'split': 'split', 'sépare': 'split', 'separe': 'split', 'divise': 'split', 'scinde': 'split',
    'tri': 'sort', 'sort': 'sort', 'ordonn': 'sort',
    'dédoublon': 'dedup', 'dedoublon': 'dedup', 'doublon': 'dedup', 'dedup': 'dedup', 'unique': 'dedup',
    'valid': 'validate', 'contrôle': 'validate', 'controle': 'validate',
    # Banque / IA
    'masqu': 'mask_pii', 'mask': 'mask_pii', 'rgpd': 'mask_pii', 'pii': 'mask_pii',
    'anonymi': 'mask_pii', 'sensible': 'mask_pii',
    'anomal': 'detect_anomalies', 'fraude': 'detect_anomalies', 'suspect': 'detect_anomalies',
    'qualit': 'quality_report', 'quality': 'quality_report', 'rapport': 'quality_report',
    'transformation ia': 'ai_transform', 'ia transform': 'ai_transform', 'intelligence artif': 'ai_transform',
    # Déclencheur
    'planif': 'schedule_trigger', 'déclencheur': 'schedule_trigger', 'declencheur': 'schedule_trigger',
    'trigger': 'schedule_trigger', 'cron': 'schedule_trigger', 'récurren': 'schedule_trigger',
}

# Labels lisibles par défaut (si l'agent n'en fournit pas).
NODE_TYPE_LABELS = {
    'csv_reader': 'Source CSV', 'json_reader': 'Source JSON', 'sql_query': 'Requête SQL',
    'http_request': 'Requête HTTP',
    'filter': 'Filtre', 'map': 'Transformation', 'aggregate': 'Agrégation',
    'join': 'Jointure', 'sort': 'Tri', 'dedup': 'Dédoublonnage',
    'sql_transform': 'Transformation SQL', 'validate': 'Validation',
    'split': 'Séparation', 'merge': 'Fusion', 'ai_transform': 'Transformation IA',
    'mask_pii': 'Masquage RGPD', 'detect_anomalies': 'Détection anomalies',
    'quality_report': 'Rapport qualité',
    'file_export': 'Export', 'sql_write': 'Écriture SQL', 'chart': 'Graphique',
    'table_preview': 'Aperçu', 'notification_send': 'Notification',
    'webhook_send': 'Webhook', 'schedule_trigger': 'Déclencheur',
}


def _resolve_node_type(params):
    """Déduit un type de nœud canonique depuis params.node_type/type/label.

    Tolère les synonymes ('masquage'->mask_pii) et infère depuis le label quand
    le type est absent, pour éviter des nœuds génériques 'filter' indésirables.
    """
    raw = (params.get('node_type') or params.get('type') or params.get('nodeType') or '')
    raw = str(raw).strip().lower()
    if raw in CANONICAL_NODE_TYPES:
        return raw
    candidates = [raw, str(params.get('label') or '').strip().lower()]
    for cand in candidates:
        if not cand:
            continue
        if cand in CANONICAL_NODE_TYPES:
            return cand
        for key, canon in NODE_TYPE_ALIASES.items():
            if key in cand:
                return canon
    return 'filter'


def _ordered_nodes(pipeline):
    """Nœuds dans l'ordre de création (déterministe)."""
    return sorted(pipeline.nodes, key=lambda n: (n.created_at or datetime.min, n.id))


def autowire_pipeline(pipeline_id):
    """Relie en chaîne les nœuds d'un pipeline NON câblé (0 lien).

    Sécurité : ne fait rien si des liens existent déjà (on respecte la topologie
    voulue) ou s'il y a moins de 2 nœuds. Garantit qu'un pipeline créé par l'agent
    soit exécutable même si l'étape `connect_nodes` du plan a échoué.
    Renvoie le nombre de liens ajoutés.
    """
    pipeline = Pipeline.query.get(pipeline_id) if pipeline_id else None
    if not pipeline or pipeline.edges:
        return 0
    nodes = _ordered_nodes(pipeline)
    if len(nodes) < 2:
        return 0
    for a, b in zip(nodes, nodes[1:]):
        db.session.add(Edge(pipeline_id=pipeline.id, source_node_id=a.id, target_node_id=b.id))
    db.session.commit()
    realtime.publish(pipeline.id, 'pipeline.updated', {'autowired': len(nodes) - 1})
    return len(nodes) - 1


# Nœuds considérés comme « sortie » d'un pipeline.
OUTPUT_NODE_TYPES = {'file_export', 'sql_write', 'table_preview', 'chart',
                     'notification_send', 'webhook_send'}


def ensure_output_node(pipeline_id):
    """Garantit qu'un pipeline se termine par une SORTIE RELIÉE.
    - Aucun nœud de sortie -> ajoute un `file_export` relié au dernier nœud.
    - Sortie existante mais orpheline (sans entrée) -> la relie au dernier nœud amont.
    Idempotent. Renvoie l'id du nœud ajouté (si nouveau), sinon None."""
    pipeline = Pipeline.query.get(pipeline_id) if pipeline_id else None
    if not pipeline:
        return None
    nodes = _ordered_nodes(pipeline)
    if not nodes:
        return None
    targets = {e.target_node_id for e in pipeline.edges}
    outputs = [n for n in nodes if n.type_slug in OUTPUT_NODE_TYPES]
    upstream = [n for n in nodes if n.type_slug not in OUTPUT_NODE_TYPES]

    if outputs:
        # Relier toute sortie orpheline (sans entrée) au dernier nœud amont.
        changed = False
        for out in outputs:
            if out.id not in targets and upstream:
                db.session.add(Edge(pipeline_id=pipeline.id,
                                    source_node_id=upstream[-1].id, target_node_id=out.id))
                changed = True
        if changed:
            db.session.commit()
            realtime.publish(pipeline.id, 'pipeline.updated', {'output_connected': True})
        return None

    # Aucune sortie -> en ajouter une, reliée au dernier nœud.
    out = Node(pipeline_id=pipeline.id, type_slug='file_export', label='Export',
               position_x=200 + len(nodes) * 220, position_y=320)
    out.config = {'format': 'csv'}
    db.session.add(out)
    db.session.flush()
    db.session.add(Edge(pipeline_id=pipeline.id, source_node_id=nodes[-1].id, target_node_id=out.id))
    db.session.commit()
    realtime.publish(pipeline.id, 'pipeline.updated', {'added_node': out.id, 'output': True})
    return out.id


def ingest_file(user_id, filename, content):
    """Enregistre un fichier (bytes) dans le workspace de l'utilisateur + parse le schéma.
    Renvoie l'objet File (ou None si pas de workspace)."""
    from flask import current_app
    import pandas as pd
    ws_id = _user_workspace_id(user_id)
    if not ws_id:
        return None
    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], ws_id)
    os.makedirs(upload_dir, exist_ok=True)
    path = os.path.join(upload_dir, filename)
    with open(path, 'wb') as fp:
        fp.write(content)

    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'csv'
    cols, rows, preview = [], 0, []
    try:
        if ext == 'json':
            df = pd.read_json(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content), on_bad_lines='skip')
        cols = [str(c) for c in df.columns]
        rows = len(df)
        preview = df.head(5).to_dict(orient='records')
    except Exception:
        pass

    f = File(workspace_id=ws_id, name=filename, original_name=filename,
             size=len(content), mime_type='text/csv' if ext != 'json' else 'application/json',
             path=path, rows_count=rows, columns_count=len(cols))
    f.columns = cols
    f.preview = preview
    db.session.add(f)
    db.session.commit()
    return f


def build_audit_report(run, pipeline):
    """Rapport de conformité bancaire d'un run (partagé par l'API et le bot Telegram)."""
    results = run.node_results
    node_by_id = {n.id: n for n in pipeline.nodes}
    steps, masked_columns, quality_scores = [], set(), []
    total_anomalies = 0
    for nid, res in results.items():
        node = node_by_id.get(nid)
        extra = res.get('extra') or {}
        masked = extra.get('masked_columns') or []
        for m in masked:
            masked_columns.add(m.get('column'))
        if isinstance(extra.get('anomalies'), int):
            total_anomalies += extra['anomalies']
        q = (res.get('quality') or {}).get('score')
        if q is not None:
            quality_scores.append(q)
        steps.append({
            'node': node.label if node else nid,
            'type': node.type_slug if node else None,
            'status': res.get('status'),
            'rows_in': res.get('rows_processed'), 'rows_out': res.get('rows_output'),
            'masked_columns': [m.get('column') for m in masked],
            'anomalies_detected': extra.get('anomalies'),
            'quality_score': q,
        })
    return {
        'report_type': 'compliance_audit',
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'pipeline': {'id': pipeline.id, 'name': pipeline.name},
        'run': {'id': run.id, 'status': run.status, 'duration_ms': run.duration_ms},
        'compliance': {
            'pii_anonymised': len(masked_columns) > 0,
            'anonymised_columns': sorted(c for c in masked_columns if c),
            'anomalies_detected': total_anomalies,
            'final_quality_score': quality_scores[-1] if quality_scores else None,
        },
        'steps': steps,
    }


def _user_workspace_id(user_id):
    member = OrgMember.query.filter_by(user_id=user_id).first()
    if not member:
        return None
    ws = Workspace.query.filter_by(org_id=member.org_id).first()
    return ws.id if ws else None


def _node_ref(params):
    """Extrait la référence de nœud quelle que soit la clé utilisée par l'agent
    (node / label / name / node_id / target / id)."""
    for k in ('node', 'label', 'name', 'node_id', 'target', 'id'):
        v = params.get(k)
        if v:
            return v
    return None


def _find_node(pipeline, ref):
    """Résout un nœud depuis une référence libre de l'agent (id, label, type,
    ordinal, ou « source »/« sortie »). Tolérant pour fiabiliser connect/configure."""
    ref = str(ref or '').lower().strip()
    if not ref:
        return None
    nodes = _ordered_nodes(pipeline)
    # 1) id exact
    for n in nodes:
        if n.id == ref:
            return n
    # 2) label exact puis sous-chaîne (dans les deux sens)
    for n in nodes:
        if (n.label or '').lower() == ref:
            return n
    for n in nodes:
        lbl = (n.label or '').lower()
        if lbl and (ref in lbl or lbl in ref):
            return n
    # 3) par type (canonique ou alias)
    canon = _resolve_node_type({'node_type': ref})
    for n in nodes:
        if n.type_slug == ref or n.type_slug == canon:
            return n
    # 4) ordinal (« 1 », « nœud 2 ») / extrêmes (source / sortie)
    import re
    m = re.search(r'\d+', ref)
    if m:
        idx = int(m.group(0)) - 1
        if 0 <= idx < len(nodes):
            return nodes[idx]
    if nodes and any(k in ref for k in ('source', 'premier', 'première', 'entrée', 'entree', 'début', 'debut')):
        return nodes[0]
    if nodes and any(k in ref for k in ('sortie', 'dernier', 'dernière', 'derniere', 'fin', 'export')):
        return nodes[-1]
    return None


def run_action(user_id, action, params, pipeline_id=None):
    """Execute one agent action. Returns {ok, message, pipeline_id, data?}."""
    params = params or {}
    pipeline = Pipeline.query.get(pipeline_id) if pipeline_id else None

    if action == 'create_pipeline':
        ws_id = _user_workspace_id(user_id)
        if not ws_id:
            return {'ok': False, 'message': "Aucun workspace pour cet utilisateur."}
        p = Pipeline(workspace_id=ws_id, name=params.get('name') or 'Nouveau pipeline')
        db.session.add(p)
        db.session.commit()
        return {'ok': True, 'pipeline_id': p.id,
                'message': f"Pipeline « {p.name} » créé."}

    if action == 'select_pipeline':
        # Cible un pipeline existant PAR SON NOM (« vas dans le pipeline X »).
        ws_id = _user_workspace_id(user_id)
        name = (params.get('name') or '').strip().lower()
        q = Pipeline.query.filter_by(workspace_id=ws_id) if ws_id else Pipeline.query
        pipes = q.all()
        match = (next((p for p in pipes if (p.name or '').lower() == name), None)
                 or next((p for p in pipes if name and name in (p.name or '').lower()), None))
        if not match:
            return {'ok': False, 'message': f"Pipeline « {params.get('name')} » introuvable."}
        return {'ok': True, 'pipeline_id': match.id,
                'message': f"Pipeline « {match.name} » sélectionné."}

    if pipeline is None:
        return {'ok': False, 'message': "Aucun pipeline cible."}

    if action == 'add_node':
        ntype = _resolve_node_type(params)
        # Anti-doublon de sortie : si on ajoute une sortie et qu'il en existe déjà
        # une, on la réutilise (évite deux « Export » dans le même pipeline).
        if ntype in OUTPUT_NODE_TYPES:
            existing_out = next((n for n in pipeline.nodes if n.type_slug in OUTPUT_NODE_TYPES), None)
            if existing_out:
                return {'ok': True, 'pipeline_id': pipeline.id, 'node_id': existing_out.id,
                        'message': f"Sortie déjà présente (« {existing_out.label} ») — réutilisée."}
        # Anti-doublon de source : ajouter une source VIDE alors qu'un lecteur du
        # même type existe -> on le réutilise (un fichier explicite reste autorisé,
        # pour les jointures à plusieurs sources).
        if ntype in ('csv_reader', 'json_reader') and not (params.get('config') or {}).get('file_id'):
            existing_src = next((n for n in pipeline.nodes if n.type_slug == ntype), None)
            if existing_src:
                return {'ok': True, 'pipeline_id': pipeline.id, 'node_id': existing_src.id,
                        'message': f"Source déjà présente (« {existing_src.label} ») — réutilisée."}
        label = params.get('label') or NODE_TYPE_LABELS.get(ntype) or ntype.replace('_', ' ').title()
        rank = len(pipeline.nodes)                       # échelonne pour éviter le chevauchement
        node = Node(pipeline_id=pipeline.id, type_slug=ntype, label=label,
                    position_x=params.get('x', 200 + rank * 220),
                    position_y=params.get('y', 320))
        node.config = params.get('config') or {}
        db.session.add(node)
        db.session.commit()
        realtime.publish(pipeline.id, 'pipeline.updated', {'added_node': node.id})
        return {'ok': True, 'pipeline_id': pipeline.id, 'node_id': node.id,
                'message': f"Nœud « {node.label} » ajouté."}

    if action == 'insert_node':
        # Insère un nœud AU MILIEU : sur l'arête source->target, ou après un nœud.
        ntype = _resolve_node_type(params)
        label = params.get('label') or NODE_TYPE_LABELS.get(ntype) or ntype.replace('_', ' ').title()
        rank = len(pipeline.nodes)
        node = Node(pipeline_id=pipeline.id, type_slug=ntype, label=label,
                    position_x=params.get('x', 200 + rank * 220), position_y=params.get('y', 320))
        node.config = params.get('config') or {}
        db.session.add(node)
        db.session.flush()
        src = _find_node(pipeline, params.get('source') or params.get('after'))
        tgt = _find_node(pipeline, params.get('target') or params.get('before'))
        if src and tgt and src.id != tgt.id:
            # Coupe l'arête src->tgt et intercale le nœud.
            Edge.query.filter_by(pipeline_id=pipeline.id,
                                 source_node_id=src.id, target_node_id=tgt.id).delete()
            db.session.add(Edge(pipeline_id=pipeline.id, source_node_id=src.id, target_node_id=node.id))
            db.session.add(Edge(pipeline_id=pipeline.id, source_node_id=node.id, target_node_id=tgt.id))
            msg = f"« {node.label} » inséré entre « {src.label} » et « {tgt.label} »."
        elif src:
            # Insère APRÈS src : ses sorties passent désormais par le nœud.
            for e in Edge.query.filter_by(pipeline_id=pipeline.id, source_node_id=src.id).all():
                db.session.add(Edge(pipeline_id=pipeline.id, source_node_id=node.id, target_node_id=e.target_node_id))
                db.session.delete(e)
            db.session.add(Edge(pipeline_id=pipeline.id, source_node_id=src.id, target_node_id=node.id))
            msg = f"« {node.label} » inséré après « {src.label} »."
        else:
            msg = f"Nœud « {node.label} » ajouté (source/cible non trouvées pour l'insertion)."
        db.session.commit()
        realtime.publish(pipeline.id, 'pipeline.updated', {'inserted_node': node.id})
        return {'ok': True, 'pipeline_id': pipeline.id, 'node_id': node.id, 'message': msg}

    if action == 'connect_nodes':
        src = _find_node(pipeline, params.get('source'))
        tgt = _find_node(pipeline, params.get('target'))
        if not src or not tgt:
            return {'ok': False, 'message': "Nœud source ou cible introuvable."}
        if src.id == tgt.id:
            return {'ok': False, 'message': "Source et cible identiques — connexion ignorée."}
        db.session.add(Edge(pipeline_id=pipeline.id, source_node_id=src.id, target_node_id=tgt.id))
        db.session.commit()
        realtime.publish(pipeline.id, 'pipeline.updated', {'connected': [src.id, tgt.id]})
        return {'ok': True, 'pipeline_id': pipeline.id,
                'message': f"« {src.label} » → « {tgt.label} » connectés."}

    if action == 'delete_node':
        n = _find_node(pipeline, _node_ref(params))
        if not n:
            return {'ok': False, 'message': "Nœud introuvable."}
        Edge.query.filter(
            (Edge.source_node_id == n.id) | (Edge.target_node_id == n.id),
            Edge.pipeline_id == pipeline.id).delete(synchronize_session=False)
        label = n.label
        db.session.delete(n)
        db.session.commit()
        realtime.publish(pipeline.id, 'pipeline.updated', {'deleted_node': True})
        return {'ok': True, 'pipeline_id': pipeline.id, 'message': f"Nœud « {label} » supprimé."}

    if action == 'configure_node':
        n = _find_node(pipeline, _node_ref(params))
        if not n:
            return {'ok': False, 'message': "Nœud introuvable."}
        cfg = n.config
        cfg.update(params.get('config') or {})
        n.config = cfg
        db.session.commit()
        realtime.publish(pipeline.id, 'pipeline.updated', {'configured_node': n.id})
        return {'ok': True, 'pipeline_id': pipeline.id, 'message': f"Nœud « {n.label} » configuré."}

    if action == 'attach_file':
        # Attache un fichier du workspace (par NOM ou file_id) à un nœud source.
        ws_id = _user_workspace_id(user_id)
        ref = str(params.get('filename') or params.get('file') or params.get('file_id') or '').strip()
        files = (File.query.filter_by(workspace_id=ws_id).all() if ws_id else File.query.all())
        f = (next((x for x in files if x.id == ref), None)
             or next((x for x in files if ref.lower() in ((x.name or '').lower(),
                                                           (x.original_name or '').lower())), None)
             or next((x for x in files if ref and ref.lower() in (x.name or '').lower()), None))
        if not f:
            return {'ok': False, 'message': f"Fichier « {ref} » introuvable. Uploade-le d'abord."}
        # Nœud cible : explicite (params.node), sinon le 1er lecteur CSV/JSON.
        node = _find_node(pipeline, params.get('node')) if params.get('node') else None
        if node is None:
            node = next((n for n in _ordered_nodes(pipeline)
                         if n.type_slug in ('csv_reader', 'json_reader')), None)
        if node is None:
            # Aucun nœud source encore présent -> on en crée un avec le fichier
            # (gère l'ordre « attache X comme source » avant la création du reader).
            ntype = 'json_reader' if (f.name or '').lower().endswith('.json') else 'csv_reader'
            node = Node(pipeline_id=pipeline.id, type_slug=ntype, label=f.name,
                        position_x=200, position_y=320)
            node.config = {'file_id': f.id}
            db.session.add(node)
            db.session.commit()
            realtime.publish(pipeline.id, 'pipeline.updated', {'added_node': node.id})
            return {'ok': True, 'pipeline_id': pipeline.id, 'node_id': node.id,
                    'message': f"Source « {f.name} » créée."}
        cfg = node.config
        cfg['file_id'] = f.id
        node.config = cfg
        db.session.commit()
        realtime.publish(pipeline.id, 'pipeline.updated', {'configured_node': node.id})
        return {'ok': True, 'pipeline_id': pipeline.id,
                'message': f"Fichier « {f.name} » attaché au nœud « {node.label} »."}

    if action == 'run_pipeline':
        from .routes.runs import _execute
        from .models import Run
        if not pipeline.nodes:
            return {'ok': False, 'message': "Le pipeline n'a aucun nœud."}
        run = Run(pipeline_id=pipeline.id, trigger='telegram', status='pending')
        db.session.add(run)
        db.session.flush()
        _execute(pipeline, run, user_id)
        results = run.node_results
        total = sum((r.get('rows_output') or 0) for r in results.values())
        anomalies = sum((r.get('extra', {}) or {}).get('anomalies', 0)
                        for r in results.values() if isinstance(r.get('extra'), dict))
        realtime.publish(pipeline.id, 'run.finished',
                         {'run_id': run.id, 'status': run.status, 'node_results': results})
        return {'ok': True, 'pipeline_id': pipeline.id, 'run_id': run.id,
                'message': f"Exécution {run.status} : {total} ligne(s)"
                           + (f", 🚨 {anomalies} anomalie(s)" if anomalies else "")}

    if action == 'generate_sql':
        from flask import current_app  # noqa: F401
        from .routes import ai as ai_mod
        sql, expl, _ = ai_mod._agent_sql_and_explanation(params.get('description', ''), [])
        node = Node(pipeline_id=pipeline.id, type_slug='sql_transform', label='Transformation IA',
                    position_x=700, position_y=360)
        node.config = {'query': sql}
        db.session.add(node)
        db.session.commit()
        realtime.publish(pipeline.id, 'pipeline.updated', {'added_node': node.id})
        return {'ok': True, 'pipeline_id': pipeline.id,
                'message': f"Nœud SQL ajouté : {expl}\n{sql}"}

    return {'ok': False, 'message': f"Action « {action} » non exécutable côté serveur."}
