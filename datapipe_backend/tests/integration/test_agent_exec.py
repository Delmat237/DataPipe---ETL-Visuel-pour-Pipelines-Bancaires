"""Server-side agent action executor (utilisé par le bot Telegram)."""
from app import create_app
from app.extensions import db
from app.models import User, Org, OrgMember, Workspace, Pipeline, Node
from app import agent_exec


def _setup(app):
    with app.app_context():
        db.create_all()
        u = User(email='bot@t.co', name='Bot'); u.set_password('x'); db.session.add(u); db.session.flush()
        org = Org(name='O'); db.session.add(org); db.session.flush()
        db.session.add(OrgMember(org_id=org.id, user_id=u.id, role='owner'))
        ws = Workspace(org_id=org.id, name='W'); db.session.add(ws); db.session.flush()
        p = Pipeline(workspace_id=ws.id, name='P'); db.session.add(p); db.session.flush()
        db.session.commit()
        return u.id, p.id


def test_run_action_crud_and_run():
    app = create_app(testing=True)
    uid, pid = _setup(app)
    with app.app_context():
        r = agent_exec.run_action(uid, 'create_pipeline', {'name': 'Démo Bot'})
        assert r['ok'] and r['pipeline_id']
        newpid = r['pipeline_id']

        r = agent_exec.run_action(uid, 'add_node', {'node_type': 'csv_reader', 'label': 'Source'}, newpid)
        assert r['ok']
        r = agent_exec.run_action(uid, 'add_node', {'node_type': 'mask_pii', 'label': 'Masquage'}, newpid)
        assert r['ok']

        r = agent_exec.run_action(uid, 'connect_nodes', {'source': 'Source', 'target': 'Masquage'}, newpid)
        assert r['ok'], r

        r = agent_exec.run_action(uid, 'run_pipeline', {}, newpid)
        assert r['ok'] and 'run_id' in r

        r = agent_exec.run_action(uid, 'delete_node', {'node': 'Masquage'}, newpid)
        assert r['ok']


def test_ingest_file_creates_file():
    app = create_app(testing=True)
    uid, _ = _setup(app)
    with app.app_context():
        csv = b"montant,type\n100,credit\n-50,debit\n9000,credit\n"
        f = agent_exec.ingest_file(uid, 'tx.csv', csv)
        assert f is not None
        assert f.rows_count == 3
        assert set(f.columns) == {'montant', 'type'}
        import os
        assert os.path.exists(f.path)


def test_node_type_inference_and_aliases():
    """add_node déduit le type canonique depuis le label ou un alias."""
    app = create_app(testing=True)
    uid, _ = _setup(app)
    with app.app_context():
        from app.models import Node
        pid = agent_exec.run_action(uid, 'create_pipeline', {'name': 'Hard'})['pipeline_id']
        # type absent -> inféré depuis le label
        agent_exec.run_action(uid, 'add_node', {'label': 'Masquage RGPD'}, pid)
        # alias dans node_type ('anomalies' -> detect_anomalies)
        agent_exec.run_action(uid, 'add_node', {'node_type': 'anomalies'}, pid)
        # synonyme 'source' -> csv_reader
        agent_exec.run_action(uid, 'add_node', {'node_type': 'source'}, pid)
        types = {n.type_slug for n in Node.query.filter_by(pipeline_id=pid).all()}
        assert {'mask_pii', 'detect_anomalies', 'csv_reader'} <= types
        assert 'filter' not in types          # plus de générique indésirable


def test_autowire_pipeline():
    """autowire relie un pipeline non câblé, et reste idempotent / sûr."""
    app = create_app(testing=True)
    uid, _ = _setup(app)
    with app.app_context():
        from app.models import Edge
        pid = agent_exec.run_action(uid, 'create_pipeline', {'name': 'Wire'})['pipeline_id']
        agent_exec.run_action(uid, 'add_node', {'node_type': 'csv_reader', 'label': 'Src'}, pid)
        agent_exec.run_action(uid, 'add_node', {'node_type': 'mask_pii', 'label': 'Mask'}, pid)
        agent_exec.run_action(uid, 'add_node', {'node_type': 'file_export', 'label': 'Out'}, pid)
        assert Edge.query.filter_by(pipeline_id=pid).count() == 0
        assert agent_exec.autowire_pipeline(pid) == 2      # 3 nœuds -> 2 liens
        assert agent_exec.autowire_pipeline(pid) == 0      # déjà câblé -> no-op


def test_find_node_tolerant():
    """_find_node résout par type, ordinal et extrêmes (source/sortie)."""
    app = create_app(testing=True)
    uid, _ = _setup(app)
    with app.app_context():
        from app.models import Pipeline
        pid = agent_exec.run_action(uid, 'create_pipeline', {'name': 'Find'})['pipeline_id']
        agent_exec.run_action(uid, 'add_node', {'node_type': 'csv_reader', 'label': 'Source CSV'}, pid)
        agent_exec.run_action(uid, 'add_node', {'node_type': 'mask_pii', 'label': 'Masquage'}, pid)
        p = Pipeline.query.get(pid)
        assert agent_exec._find_node(p, 'mask_pii').type_slug == 'mask_pii'   # par type
        assert agent_exec._find_node(p, 'source').type_slug == 'csv_reader'   # extrême
        assert agent_exec._find_node(p, '2').type_slug == 'mask_pii'          # ordinal
        assert agent_exec._find_node(p, 'Masquage').type_slug == 'mask_pii'   # label


def test_select_pipeline_by_name():
    """L'agent cible un pipeline existant par son nom (« va dans le pipeline X »)."""
    app = create_app(testing=True)
    uid, _ = _setup(app)
    with app.app_context():
        created = agent_exec.run_action(uid, 'create_pipeline', {'name': 'Conformité Q1'})
        r = agent_exec.run_action(uid, 'select_pipeline', {'name': 'conformité'})  # sous-chaîne, insensible casse
        assert r['ok'] and r['pipeline_id'] == created['pipeline_id']
        assert not agent_exec.run_action(uid, 'select_pipeline', {'name': 'inexistant'})['ok']


def test_ensure_output_node():
    """Toujours une sortie : ajoutée si absente, reliée, idempotente."""
    app = create_app(testing=True)
    uid, _ = _setup(app)
    with app.app_context():
        from app.models import Node, Edge
        pid = agent_exec.run_action(uid, 'create_pipeline', {'name': 'Out'})['pipeline_id']
        agent_exec.run_action(uid, 'add_node', {'node_type': 'csv_reader', 'label': 'S'}, pid)
        agent_exec.run_action(uid, 'add_node', {'node_type': 'mask_pii', 'label': 'M'}, pid)
        out_id = agent_exec.ensure_output_node(pid)
        assert out_id and Node.query.get(out_id).type_slug == 'file_export'
        assert Edge.query.filter_by(pipeline_id=pid, target_node_id=out_id).count() == 1   # reliée
        assert agent_exec.ensure_output_node(pid) is None                                  # idempotent


def test_insert_node_in_middle():
    """insert_node coupe l'arête source->target et intercale le nœud."""
    app = create_app(testing=True)
    uid, _ = _setup(app)
    with app.app_context():
        from app.models import Edge, Node
        pid = agent_exec.run_action(uid, 'create_pipeline', {'name': 'Ins'})['pipeline_id']
        agent_exec.run_action(uid, 'add_node', {'node_type': 'csv_reader', 'label': 'Src'}, pid)
        agent_exec.run_action(uid, 'add_node', {'node_type': 'aggregate', 'label': 'Agg'}, pid)
        agent_exec.run_action(uid, 'connect_nodes', {'source': 'Src', 'target': 'Agg'}, pid)
        r = agent_exec.run_action(uid, 'insert_node',
                                  {'node_type': 'filter', 'source': 'Src', 'target': 'Agg'}, pid)
        assert r['ok'], r
        ns = {n.id: n.type_slug for n in Node.query.filter_by(pipeline_id=pid).all()}
        pairs = {(ns[e.source_node_id], ns[e.target_node_id])
                 for e in Edge.query.filter_by(pipeline_id=pid).all()}
        assert ('csv_reader', 'filter') in pairs and ('filter', 'aggregate') in pairs
        assert ('csv_reader', 'aggregate') not in pairs   # l'arête directe est coupée


def test_add_node_output_dedup():
    """Ajouter une 2e sortie réutilise l'existante (pas de doublon « Export »)."""
    app = create_app(testing=True)
    uid, _ = _setup(app)
    with app.app_context():
        from app.models import Node
        pid = agent_exec.run_action(uid, 'create_pipeline', {'name': 'Dup'})['pipeline_id']
        agent_exec.run_action(uid, 'add_node', {'node_type': 'file_export', 'label': 'Export'}, pid)
        agent_exec.run_action(uid, 'add_node', {'node_type': 'file_export', 'label': 'Export 2'}, pid)
        assert Node.query.filter_by(pipeline_id=pid, type_slug='file_export').count() == 1


def test_attach_file_by_name():
    """L'agent attache un fichier uploadé PAR SON NOM au nœud source."""
    app = create_app(testing=True)
    uid, _ = _setup(app)
    with app.app_context():
        from app.models import Node
        agent_exec.ingest_file(uid, 'transactions.csv', b'montant,type\n100,credit\n200,debit\n')
        pid = agent_exec.run_action(uid, 'create_pipeline', {'name': 'Att'})['pipeline_id']
        agent_exec.run_action(uid, 'add_node', {'node_type': 'csv_reader', 'label': 'Source CSV'}, pid)
        r = agent_exec.run_action(uid, 'attach_file', {'filename': 'transactions.csv'}, pid)
        assert r['ok'], r
        n = Node.query.filter_by(pipeline_id=pid, type_slug='csv_reader').first()
        assert n.config.get('file_id')
        assert not agent_exec.run_action(uid, 'attach_file', {'filename': 'absent.csv'}, pid)['ok']


def test_connect_self_loop_rejected():
    """Une connexion d'un nœud vers lui-même est refusée (anti auto-boucle)."""
    app = create_app(testing=True)
    uid, _ = _setup(app)
    with app.app_context():
        pid = agent_exec.run_action(uid, 'create_pipeline', {'name': 'Loop'})['pipeline_id']
        agent_exec.run_action(uid, 'add_node', {'node_type': 'filter', 'label': 'F'}, pid)
        assert not agent_exec.run_action(uid, 'connect_nodes', {'source': 'F', 'target': 'F'}, pid)['ok']
