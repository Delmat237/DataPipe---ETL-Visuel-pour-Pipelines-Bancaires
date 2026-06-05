"""
Telegram bot integration — pilote DataPipe par chat.

Tu écris au bot -> /telegram/webhook -> l'agent (Groq) propose une action/plan ->
boutons inline « Confirmer / Annuler » -> exécution SERVEUR (agent_exec) -> réponse
au bot + event temps réel vers le web (l'éditeur redessine le pipeline en direct).

Le bot agit comme le compte démo, sur son pipeline courant.
"""
import json
import urllib.request

from flask import Blueprint, request, jsonify, current_app

from .ai import plan_from_message
from ..agent_exec import run_action, ingest_file, autowire_pipeline, ensure_output_node
from ..models import User, Pipeline, OrgMember, Workspace

telegram_bp = Blueprint('telegram', __name__)

_PENDING = {}     # chat_id -> plan (action ou plan multi-étapes)


def _tg(method, payload):
    token = current_app.config.get('TELEGRAM_BOT_TOKEN', '')
    if not token:
        current_app.logger.warning("TELEGRAM_BOT_TOKEN absent — message non envoyé")
        return None
    try:
        req = urllib.request.Request(
            f'https://api.telegram.org/bot{token}/{method}',
            data=json.dumps(payload).encode(),
            headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:  # noqa: BLE001
        current_app.logger.error(f"Telegram API error: {e}")
        return None


def _download_telegram_file(file_id):
    """Télécharge le contenu d'un fichier Telegram (getFile -> file API)."""
    token = current_app.config.get('TELEGRAM_BOT_TOKEN', '')
    if not token:
        return None, None
    info = _tg('getFile', {'file_id': file_id})
    if not info or not info.get('ok'):
        return None, None
    file_path = info['result']['file_path']
    try:
        url = f'https://api.telegram.org/file/bot{token}/{file_path}'
        with urllib.request.urlopen(url, timeout=30) as r:
            return r.read(), file_path
    except Exception as e:  # noqa: BLE001
        current_app.logger.error(f"Telegram download error: {e}")
        return None, None


def _send_document(chat_id, filename, content, caption='', mime='text/csv'):
    """Envoie un fichier en pièce jointe (sendDocument, multipart)."""
    token = current_app.config.get('TELEGRAM_BOT_TOKEN', '')
    if not token:
        return None
    boundary = 'dpBoundary7MA4YWxkTrZu0gW'
    body = b''
    for k, v in {'chat_id': str(chat_id), 'caption': caption[:1000]}.items():
        body += (f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n').encode()
    body += (f'--{boundary}\r\nContent-Disposition: form-data; name="document"; '
             f'filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n').encode()
    body += (content if isinstance(content, bytes) else content.encode()) + f'\r\n--{boundary}--\r\n'.encode()
    try:
        req = urllib.request.Request(
            f'https://api.telegram.org/bot{token}/sendDocument', data=body,
            headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except Exception as e:  # noqa: BLE001
        current_app.logger.error(f"Telegram sendDocument error: {e}")
        return None


def _send_photo(chat_id, photo_url, caption=''):
    """Envoie une image (sendPhoto via URL — Telegram récupère l'image)."""
    return _tg('sendPhoto', {'chat_id': chat_id, 'photo': photo_url, 'caption': caption[:1000]})


def _quickchart_url(labels, values, title, kind='bar'):
    """Construit une URL QuickChart (image PNG d'un graphe Chart.js)."""
    import urllib.parse
    config = {
        'type': kind,
        'data': {'labels': labels,
                 'datasets': [{'label': title, 'data': values,
                               'backgroundColor': '#ff6d35'}]},
        'options': {'plugins': {'title': {'display': True, 'text': title}},
                    'legend': {'display': False}},
    }
    qs = urllib.parse.urlencode({'c': json.dumps(config), 'backgroundColor': 'white', 'width': 600, 'height': 360})
    return f'https://quickchart.io/chart?{qs}'


def _latest_run(pipeline):
    from ..models import Run
    return (Run.query.filter_by(pipeline_id=pipeline.id)
            .order_by(Run.started_at.desc()).first())


def register_webhook(app):
    """Enregistre le webhook Telegram au démarrage si PUBLIC_URL est défini (prod -> zéro polling)."""
    token = app.config.get('TELEGRAM_BOT_TOKEN', '')
    public = (app.config.get('PUBLIC_URL', '') or '').rstrip('/')
    if not token or not public:
        return
    url = f'{public}/api/v1/telegram/webhook'
    payload = {'url': url}
    if app.config.get('TELEGRAM_WEBHOOK_SECRET'):
        payload['secret_token'] = app.config['TELEGRAM_WEBHOOK_SECRET']
    try:
        req = urllib.request.Request(
            f'https://api.telegram.org/bot{token}/setWebhook',
            data=json.dumps(payload).encode(),
            headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=15) as r:
            json.loads(r.read())
        # enregistre aussi le menu de commandes
        _tg('setMyCommands', {'commands': BOT_COMMANDS})
        app.logger.info(f"Webhook Telegram enregistré : {url}")
    except Exception as e:  # noqa: BLE001
        app.logger.error(f"setWebhook a échoué : {e}")


BOT_COMMANDS = [
    {'command': 'login', 'description': 'Se connecter : /login <email> <mdp>'},
    {'command': 'logout', 'description': 'Se déconnecter'},
    {'command': 'whoami', 'description': 'Compte + pipeline courant'},
    {'command': 'pipeline', 'description': 'Résumé du pipeline'},
    {'command': 'new', 'description': 'Créer un pipeline : /new <nom>'},
    {'command': 'run', 'description': 'Exécuter le pipeline'},
    {'command': 'preview', 'description': 'Aperçu des données (CSV)'},
    {'command': 'audit', 'description': 'Rapport audit (JSON)'},
    {'command': 'anomalies', 'description': 'Transactions suspectes'},
    {'command': 'chart', 'description': 'Graphique du résultat'},
    {'command': 'alert', 'description': 'Alerte anomalies : /alert <n>'},
    {'command': 'schedule', 'description': 'Récurrent : /schedule <min>'},
    {'command': 'unschedule', 'description': 'Annuler la planification'},
    {'command': 'help', 'description': 'Aide'},
]


def _send(chat_id, text, confirm=False):
    payload = {'chat_id': chat_id, 'text': text}
    if confirm:
        payload['reply_markup'] = {'inline_keyboard': [[
            {'text': '✅ Confirmer', 'callback_data': 'confirm'},
            {'text': '✖️ Annuler', 'callback_data': 'cancel'},
        ]]}
    return _tg('sendMessage', payload)


def _first_pipeline_id(user_id):
    member = OrgMember.query.filter_by(user_id=user_id).first()
    ws = Workspace.query.filter_by(org_id=member.org_id).first() if member else None
    pipe = Pipeline.query.filter_by(workspace_id=ws.id).first() if ws else None
    return pipe.id if pipe else None


def _ensure_chat(chat_id):
    """Récupère/crée le BotChat (par défaut lié au compte démo tant que pas de /login)."""
    from ..extensions import db
    from ..models import BotChat
    chat = BotChat.query.get(str(chat_id))
    if not chat:
        demo = User.query.filter_by(email='demo@bank.cm').first()
        chat = BotChat(chat_id=str(chat_id), user_id=(demo.id if demo else None))
        db.session.add(chat)
        db.session.commit()
    return chat


def _context(chat_id):
    """(user_id, pipeline_id) — propre à l'utilisateur lié à ce chat."""
    from ..extensions import db
    chat = _ensure_chat(chat_id)
    pid = chat.current_pipeline_id or _first_pipeline_id(chat.user_id)
    if pid and pid != chat.current_pipeline_id:
        chat.current_pipeline_id = pid
        db.session.commit()
    return chat.user_id, pid


def _set_current_pipeline(chat_id, pid):
    from ..extensions import db
    chat = _ensure_chat(chat_id)
    chat.current_pipeline_id = pid
    db.session.commit()


def _count_anomalies(run):
    return sum((r.get('extra', {}) or {}).get('anomalies', 0)
               for r in run.node_results.values() if isinstance(r.get('extra'), dict))


def _maybe_alert(chat_id, run):
    """Notifie si le nombre d'anomalies dépasse le seuil configuré (/alert)."""
    from ..models import BotChat
    chat = BotChat.query.get(str(chat_id))
    if not chat or chat.anomaly_threshold is None or not run:
        return
    n = _count_anomalies(run)
    if n > chat.anomaly_threshold:
        _send(chat_id, f"🚨 ALERTE : {n} anomalie(s) détectée(s) "
                       f"(seuil {chat.anomaly_threshold}). Tape /anomalies pour le détail.")


def _pipeline_summary(pipeline):
    """Résumé lisible du pipeline : étapes ordonnées + lien éditeur."""
    from ..engine.executor import _topological_order
    nodes = {n.id: n for n in pipeline.nodes}
    if not nodes:
        return f"📊 {pipeline.name} — pipeline vide."
    order, _ = _topological_order(list(nodes.keys()), list(pipeline.edges))
    lines = [f"📊 {pipeline.name} — {len(nodes)} étape(s) :"]
    for i, nid in enumerate(order, 1):
        n = nodes[nid]
        lines.append(f"  {i}. {n.label or n.type_slug}  ·  {n.type_slug}")
    base = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    lines.append(f"🔗 Éditeur : {base}/dashboard/pipelines/{pipeline.id}/editor")
    return '\n'.join(lines)


def _execute_plan(chat_id, user_id, pipeline_id, plan):
    from ..models import Run
    steps = plan.get('steps') if plan.get('type') == 'plan' else [plan]
    lines = []
    last_run_id = None
    for step in steps:
        res = run_action(user_id, step.get('action'), step.get('params'), pipeline_id)
        # « va dans le pipeline X » mais X n'existe pas -> on le crée.
        if not res.get('ok') and step.get('action') == 'select_pipeline':
            res = run_action(user_id, 'create_pipeline',
                             {'name': (step.get('params') or {}).get('name')}, None)
        if res.get('pipeline_id'):           # create/select -> nouveau pipeline courant
            pipeline_id = res['pipeline_id']
            _set_current_pipeline(chat_id, pipeline_id)
        if res.get('run_id'):
            last_run_id = res['run_id']
        lines.append(('✅ ' if res.get('ok') else '⚠️ ') + res.get('message', ''))
    # Auto-câblage de secours (pipeline non relié -> chaîne séquentielle).
    if pipeline_id and autowire_pipeline(pipeline_id):
        lines.append('🔗 Connexions ajoutées automatiquement.')
    # Garantit toujours un nœud de sortie en fin de pipeline.
    if pipeline_id and ensure_output_node(pipeline_id):
        lines.append('📤 Nœud de sortie (Export) ajouté.')
    pipe = Pipeline.query.get(pipeline_id) if pipeline_id else None
    if pipe:
        lines.append('')
        lines.append(_pipeline_summary(pipe))
    if last_run_id:                          # alerte anomalies éventuelle
        _maybe_alert(chat_id, Run.query.get(last_run_id))
    return '\n'.join(lines)


@telegram_bp.route('/telegram/webhook', methods=['POST'])
def telegram_webhook():
    # Optional shared-secret check (set in Telegram setWebhook).
    secret = current_app.config.get('TELEGRAM_WEBHOOK_SECRET', '')
    if secret and request.headers.get('X-Telegram-Bot-Api-Secret-Token') != secret:
        return jsonify({'ok': False}), 403

    update = request.get_json(silent=True) or {}

    # 1) Bouton confirmer / annuler
    cb = update.get('callback_query')
    if cb:
        chat_id = cb['message']['chat']['id']
        if cb.get('data') == 'confirm' and chat_id in _PENDING:
            plan = _PENDING.pop(chat_id)
            user_id, pid = _context(chat_id)
            result = _execute_plan(chat_id, user_id, pid, plan)
            _send(chat_id, result or 'Action effectuée.')
        else:
            _PENDING.pop(chat_id, None)
            _send(chat_id, 'Annulé.')
        _tg('answerCallbackQuery', {'callback_query_id': cb['id']})
        return jsonify({'ok': True})

    msg = update.get('message') or {}
    chat_id = (msg.get('chat') or {}).get('id')

    # 2) Document (CSV/JSON envoyé dans Telegram) -> import + source du pipeline
    doc = msg.get('document')
    if doc and chat_id is not None:
        fname = doc.get('file_name') or 'upload.csv'
        ext = fname.rsplit('.', 1)[-1].lower() if '.' in fname else ''
        if ext not in ('csv', 'json', 'txt'):
            _send(chat_id, "Format non supporté. Envoie un fichier .csv ou .json.")
            return jsonify({'ok': True})
        content, _ = _download_telegram_file(doc.get('file_id'))
        if not content:
            _send(chat_id, "Téléchargement du fichier impossible.")
            return jsonify({'ok': True})
        user_id, pid = _context(chat_id)
        f = ingest_file(user_id, fname, content)
        if not f:
            _send(chat_id, "Import impossible (workspace introuvable).")
            return jsonify({'ok': True})
        node_type = 'json_reader' if ext == 'json' else 'csv_reader'
        pipe = Pipeline.query.get(pid) if pid else None
        # Réutilise un nœud source EXISTANT sans fichier (évite un doublon),
        # sinon en ajoute un nouveau.
        existing = None
        if pipe:
            existing = next((n for n in pipe.nodes
                             if n.type_slug in ('csv_reader', 'json_reader')
                             and not (n.config or {}).get('file_id')), None)
        if existing:
            run_action(user_id, 'configure_node',
                       {'node': existing.id, 'config': {'file_id': f.id}}, pid)
            verb = f"attaché à « {existing.label} »"
        else:
            run_action(user_id, 'add_node',
                       {'node_type': node_type, 'label': fname, 'config': {'file_id': f.id}}, pid)
            verb = "ajouté comme source"
        pipe = Pipeline.query.get(pid) if pid else None
        summary = ('\n\n' + _pipeline_summary(pipe)) if pipe else ''
        _send(chat_id, f"📥 « {fname} » importé — {f.rows_count} lignes, "
                       f"{f.columns_count} colonnes. {verb}.{summary}")
        return jsonify({'ok': True})

    # 3) Message texte
    text = (msg.get('text') or '').strip()
    if not text or chat_id is None:
        return jsonify({'ok': True})

    if text.startswith('/'):
        user_id, pid = _context(chat_id)
        pipe = Pipeline.query.get(pid) if pid else None
        cmd = text.split()[0].lower()
        arg = text[len(cmd):].strip()

        if cmd in ('/start', '/help'):
            _send(chat_id, "👋 Je pilote DataPipe.\n"
                           "Compte : /login <email> <mdp> · /logout · /whoami\n"
                           "Pipeline : /pipeline · /new <nom> · /run · /preview · /audit · /anomalies · /chart\n"
                           "Auto : /alert <n> (alerte si anomalies > n) · /schedule <min> · /unschedule\n"
                           "Ou écris en clair : « masque les clients puis exécute ».\n"
                           "Tu peux aussi m'envoyer un fichier CSV/JSON.")
        elif cmd == '/login':
            from ..extensions import db
            parts = arg.split()
            if len(parts) < 2:
                _send(chat_id, "Usage : /login <email> <mot de passe>")
                return jsonify({'ok': True})
            email, pwd = parts[0], ' '.join(parts[1:])
            u = User.query.filter_by(email=email).first()
            if not u or not u.check_password(pwd):
                _send(chat_id, "❌ Identifiants invalides.")
                return jsonify({'ok': True})
            chat = _ensure_chat(chat_id)
            chat.user_id = u.id
            chat.current_pipeline_id = None
            db.session.commit()
            _send(chat_id, f"✅ Connecté en tant que {u.name} ({u.email}). Tes pipelines sont actifs.")
        elif cmd == '/logout':
            from ..extensions import db
            demo = User.query.filter_by(email='demo@bank.cm').first()
            chat = _ensure_chat(chat_id)
            chat.user_id = demo.id if demo else chat.user_id
            chat.current_pipeline_id = None
            db.session.commit()
            _send(chat_id, "Déconnecté (retour au compte démo).")
        elif cmd == '/whoami':
            u = User.query.get(user_id)
            _send(chat_id, f"👤 {u.name} ({u.email})\n" + (
                _pipeline_summary(pipe) if pipe else "Aucun pipeline courant."))
        elif cmd == '/alert':
            from ..extensions import db
            chat = _ensure_chat(chat_id)
            chat.anomaly_threshold = int(arg) if arg.isdigit() else None
            db.session.commit()
            _send(chat_id, (f"🔔 Alerte activée : je préviens si anomalies > {chat.anomaly_threshold}."
                            if chat.anomaly_threshold is not None else "🔕 Alerte désactivée."))
        elif cmd == '/schedule':
            from ..extensions import db
            from datetime import datetime, timedelta
            if not arg.isdigit() or int(arg) < 1:
                _send(chat_id, "Usage : /schedule <minutes> (ex. /schedule 60)")
                return jsonify({'ok': True})
            chat = _ensure_chat(chat_id)
            chat.schedule_minutes = int(arg)
            chat.next_run_at = datetime.utcnow() + timedelta(minutes=int(arg))
            db.session.commit()
            _send(chat_id, f"⏰ Exécution récurrente toutes les {arg} min programmée pour ce pipeline.")
        elif cmd == '/unschedule':
            from ..extensions import db
            chat = _ensure_chat(chat_id)
            chat.schedule_minutes = None
            chat.next_run_at = None
            db.session.commit()
            _send(chat_id, "⏹️ Planification annulée.")
        elif cmd == '/pipeline':
            _send(chat_id, _pipeline_summary(pipe) if pipe else "Aucun pipeline courant.")
        elif cmd == '/new':
            res = run_action(user_id, 'create_pipeline', {'name': arg or 'Nouveau pipeline'})
            if res.get('pipeline_id'):
                _set_current_pipeline(chat_id, res['pipeline_id'])
            _send(chat_id, res.get('message', ''))
        elif cmd == '/run':
            res = run_action(user_id, 'run_pipeline', {}, pid)
            pipe = Pipeline.query.get(pid)
            _send(chat_id, res.get('message', '') + (('\n\n' + _pipeline_summary(pipe)) if pipe else ''))
            if res.get('run_id'):
                from ..models import Run
                _maybe_alert(chat_id, Run.query.get(res['run_id']))
        elif cmd == '/preview':
            run = _latest_run(pipe) if pipe else None
            if not run or not run.node_results:
                _send(chat_id, "Exécute d'abord le pipeline (/run).")
                return jsonify({'ok': True})
            nid = list(run.node_results.keys())[-1]
            rows = run.node_results[nid].get('output_preview', [])
            if not rows:
                _send(chat_id, "Aucune donnée en sortie.")
                return jsonify({'ok': True})
            import csv as _csv, io as _io
            buf = _io.StringIO()
            w = _csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
            w.writeheader(); w.writerows(rows)
            _send_document(chat_id, 'apercu.csv', buf.getvalue(),
                           caption=f"Aperçu — {len(rows)} ligne(s)")
        elif cmd == '/audit':
            run = _latest_run(pipe) if pipe else None
            if not run:
                _send(chat_id, "Exécute d'abord le pipeline (/run).")
                return jsonify({'ok': True})
            from ..agent_exec import build_audit_report
            rep = build_audit_report(run, pipe)
            _send_document(chat_id, 'rapport_audit.json',
                           json.dumps(rep, indent=2, ensure_ascii=False),
                           caption="Rapport d'audit conformité", mime='application/json')
        elif cmd == '/anomalies':
            run = _latest_run(pipe) if pipe else None
            if not run or not run.node_results:
                _send(chat_id, "Exécute d'abord le pipeline (/run).")
                return jsonify({'ok': True})
            suspects = []
            for res in run.node_results.values():
                for row in res.get('output_preview', []):
                    if row.get('is_anomaly'):
                        suspects.append(row)
            if not suspects:
                _send(chat_id, "✅ Aucune transaction suspecte (ajoute un nœud « Détection anomalies »).")
                return jsonify({'ok': True})
            lines = ["🚨 Transactions suspectes :"]
            for r in suspects[:12]:
                idv = r.get('transaction_id') or r.get('id') or '?'
                amt = r.get('amount') or r.get('montant') or '?'
                reason = r.get('anomaly_reason') or ''
                lines.append(f"• {idv} — {amt}  ({reason})")
            _send(chat_id, '\n'.join(lines))
            import csv as _csv, io as _io
            buf = _io.StringIO()
            w = _csv.DictWriter(buf, fieldnames=list(suspects[0].keys()))
            w.writeheader(); w.writerows(suspects)
            _send_document(chat_id, 'anomalies.csv', buf.getvalue(),
                           caption=f"{len(suspects)} transaction(s) suspecte(s)")
        elif cmd == '/chart':
            run = _latest_run(pipe) if pipe else None
            if not run or not run.node_results:
                _send(chat_id, "Exécute d'abord le pipeline (/run).")
                return jsonify({'ok': True})
            nid = list(run.node_results.keys())[-1]
            rows = run.node_results[nid].get('output_preview', [])
            if not rows:
                _send(chat_id, "Aucune donnée à tracer.")
                return jsonify({'ok': True})

            def _isnum(v):
                try:
                    float(v); return True
                except (TypeError, ValueError):
                    return False

            cols = list(rows[0].keys())
            value_col = next((c for c in cols
                              if all(_isnum(r.get(c)) for r in rows if r.get(c) is not None)), None)
            if not value_col:
                _send(chat_id, "Aucune colonne numérique à tracer.")
                return jsonify({'ok': True})
            label_col = next((c for c in cols if c != value_col), cols[0])
            labels = [str(r.get(label_col)) for r in rows][:20]
            values = [float(r.get(value_col) or 0) for r in rows][:20]
            _send_photo(chat_id, _quickchart_url(labels, values, f"{value_col} par {label_col}"),
                        caption=f"📊 {value_col} par {label_col}")
        else:
            _send(chat_id, "Commande inconnue. Tape /help")
        return jsonify({'ok': True})

    plan = plan_from_message(text)
    if plan.get('type') == 'reply':
        _send(chat_id, plan.get('message', '...'))
        return jsonify({'ok': True})

    _PENDING[chat_id] = plan
    if plan.get('type') == 'plan':
        steps = '\n'.join(f"{i+1}. {s.get('message') or s.get('action')}"
                          for i, s in enumerate(plan.get('steps', [])))
        _send(chat_id, f"🟣 Plan proposé :\n{steps}", confirm=True)
    else:
        warn = f"\n⚠️ {plan['warning']}" if plan.get('warning') else ''
        _send(chat_id, f"🟠 {plan.get('message', '')}{warn}", confirm=True)
    return jsonify({'ok': True})
