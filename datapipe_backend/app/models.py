from datetime import datetime, timedelta
from uuid import uuid4
import json
from .extensions import db, bcrypt


def gen_id(prefix):
    return f"{prefix}_{uuid4().hex[:12]}"


# ─────────────────────────────── AUTH ────────────────────────────────

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('usr'))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    verified = db.Column(db.Boolean, default=False)
    avatar_url = db.Column(db.String(500))
    verify_token = db.Column(db.String(100))
    reset_token = db.Column(db.String(100))
    reset_token_expires = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime)

    sessions = db.relationship('UserSession', backref='user', lazy=True, cascade='all, delete-orphan')
    org_members = db.relationship('OrgMember', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    api_keys = db.relationship('ApiKey', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self, include_orgs=True):
        d = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'verified': self.verified,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() + 'Z',
        }
        if include_orgs:
            d['orgs'] = [
                {'id': m.org.id, 'name': m.org.name, 'role': m.role}
                for m in self.org_members
                if m.org and not m.org.deleted_at
            ]
        return d


class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('sess'))
    user_id = db.Column(db.String(20), db.ForeignKey('users.id'), nullable=False)
    jti = db.Column(db.String(100), unique=True, nullable=False, index=True)
    user_agent = db.Column(db.String(500))
    ip = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    revoked = db.Column(db.Boolean, default=False)

    def to_dict(self, current_jti=None):
        return {
            'id': self.id,
            'ip': self.ip,
            'device': self.user_agent or 'Unknown',
            'created_at': self.created_at.date().isoformat(),
            'current': self.jti == current_jti,
        }


# ─────────────────────────────── ORGS ────────────────────────────────

class Org(db.Model):
    __tablename__ = 'orgs'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('org'))
    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True)
    plan = db.Column(db.String(20), default='free')
    _settings = db.Column('settings', db.Text, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime)
    storage_used_mb = db.Column(db.Integer, default=0)

    members = db.relationship('OrgMember', backref='org', lazy=True, cascade='all, delete-orphan')
    workspaces = db.relationship('Workspace', backref='org', lazy=True)
    invites = db.relationship('OrgInvite', backref='org', lazy=True)

    @property
    def settings(self):
        return json.loads(self._settings or '{}')

    @settings.setter
    def settings(self, v):
        self._settings = json.dumps(v)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'plan': self.plan,
            'settings': self.settings,
            'storage_used_mb': self.storage_used_mb,
            'members_count': len(self.members),
            'created_at': self.created_at.isoformat() + 'Z',
        }


class OrgMember(db.Model):
    __tablename__ = 'org_members'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('mbr'))
    org_id = db.Column(db.String(20), db.ForeignKey('orgs.id'), nullable=False)
    user_id = db.Column(db.String(20), db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), default='viewer')
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'name': self.user.name if self.user else '',
            'email': self.user.email if self.user else '',
            'avatar_url': self.user.avatar_url if self.user else None,
            'role': self.role,
            'joined_at': self.joined_at.date().isoformat(),
        }


class OrgInvite(db.Model):
    __tablename__ = 'org_invites'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('inv'))
    org_id = db.Column(db.String(20), db.ForeignKey('orgs.id'), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='viewer')
    token = db.Column(db.String(100), unique=True, nullable=False, default=lambda: uuid4().hex)
    expires_at = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))
    accepted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Workspace(db.Model):
    __tablename__ = 'workspaces'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('ws'))
    org_id = db.Column(db.String(20), db.ForeignKey('orgs.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime)

    pipelines = db.relationship('Pipeline', backref='workspace', lazy=True)

    def to_dict(self):
        active = [p for p in self.pipelines if p.status != 'deleted']
        return {
            'id': self.id,
            'org_id': self.org_id,
            'name': self.name,
            'description': self.description,
            'color': self.color,
            'pipelines_count': len(active),
            'created_at': self.created_at.isoformat() + 'Z',
        }


# ─────────────────────────────── PIPELINES ────────────────────────────

class Pipeline(db.Model):
    __tablename__ = 'pipelines'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('pip'))
    workspace_id = db.Column(db.String(20), db.ForeignKey('workspaces.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    _tags = db.Column('tags', db.Text, default='[]')
    status = db.Column(db.String(20), default='active')
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_run_at = db.Column(db.DateTime)
    last_run_status = db.Column(db.String(20))
    version_count = db.Column(db.Integer, default=1)

    nodes = db.relationship('Node', backref='pipeline', lazy=True, cascade='all, delete-orphan')
    edges = db.relationship('Edge', backref='pipeline', lazy=True, cascade='all, delete-orphan')
    runs = db.relationship('Run', backref='pipeline', lazy=True)
    versions = db.relationship('PipelineVersion', backref='pipeline', lazy=True)
    webhooks = db.relationship('Webhook', backref='pipeline', lazy=True)
    alerts = db.relationship('Alert', backref='pipeline', lazy=True)
    schedule = db.relationship('Schedule', backref='pipeline', uselist=False, lazy=True)

    @property
    def tags(self):
        return json.loads(self._tags or '[]')

    @tags.setter
    def tags(self, v):
        self._tags = json.dumps(v)

    def to_dict(self, include_graph=False):
        d = {
            'id': self.id,
            'workspace_id': self.workspace_id,
            'name': self.name,
            'description': self.description,
            'tags': self.tags,
            'status': self.status,
            'is_public': self.is_public,
            'nodes_count': len(self.nodes),
            'last_run_at': self.last_run_at.isoformat() + 'Z' if self.last_run_at else None,
            'last_run_status': self.last_run_status,
            'created_at': self.created_at.isoformat() + 'Z',
            'updated_at': self.updated_at.isoformat() + 'Z',
        }
        if include_graph:
            d['nodes'] = [n.to_dict() for n in self.nodes]
            d['edges'] = [e.to_dict() for e in self.edges]
        return d


class PipelineVersion(db.Model):
    __tablename__ = 'pipeline_versions'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('ver'))
    pipeline_id = db.Column(db.String(20), db.ForeignKey('pipelines.id'), nullable=False)
    version_num = db.Column(db.Integer, nullable=False)
    label = db.Column(db.String(255))
    _snapshot = db.Column('snapshot', db.Text, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def snapshot(self):
        return json.loads(self._snapshot or '{}')

    @snapshot.setter
    def snapshot(self, v):
        self._snapshot = json.dumps(v)

    def to_dict(self, include_snapshot=False):
        d = {
            'id': self.id,
            'pipeline_id': self.pipeline_id,
            'version_num': self.version_num,
            'label': self.label,
            'created_at': self.created_at.isoformat() + 'Z',
        }
        if include_snapshot:
            d['snapshot'] = self.snapshot
        return d


class PipelineTemplate(db.Model):
    __tablename__ = 'pipeline_templates'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('tpl'))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    icon = db.Column(db.String(10), default='📊')
    _nodes = db.Column('nodes', db.Text, default='[]')
    _edges = db.Column('edges', db.Text, default='[]')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def nodes(self):
        return json.loads(self._nodes or '[]')

    @nodes.setter
    def nodes(self, v):
        self._nodes = json.dumps(v)

    @property
    def edges(self):
        return json.loads(self._edges or '[]')

    @edges.setter
    def edges(self, v):
        self._edges = json.dumps(v)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'icon': self.icon,
            'nodes_count': len(self.nodes),
            'created_at': self.created_at.isoformat() + 'Z',
        }


# ─────────────────────────────── NODES / EDGES ────────────────────────

class Node(db.Model):
    __tablename__ = 'nodes'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('nod'))
    pipeline_id = db.Column(db.String(20), db.ForeignKey('pipelines.id'), nullable=False)
    type_slug = db.Column(db.String(100), nullable=False)
    label = db.Column(db.String(255))
    _config = db.Column('config', db.Text, default='{}')
    position_x = db.Column(db.Float, default=0)
    position_y = db.Column(db.Float, default=0)
    _pinned_data = db.Column('pinned_data', db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def config(self):
        return json.loads(self._config or '{}')

    @config.setter
    def config(self, v):
        self._config = json.dumps(v)

    @property
    def pinned_data(self):
        return json.loads(self._pinned_data) if self._pinned_data else None

    @pinned_data.setter
    def pinned_data(self, v):
        self._pinned_data = json.dumps(v) if v is not None else None

    def to_dict(self):
        label = self.label or self.type_slug
        config = self.config
        return {
            'id': self.id,
            'pipeline_id': self.pipeline_id,
            'type': self.type_slug,
            'label': label,
            'config': config,
            'position': {'x': self.position_x, 'y': self.position_y},
            # React Flow shape consumed by the frontend (additive — flat keys kept).
            'data': {'label': label, 'config': config,
                     'type_slug': self.type_slug, 'status': 'idle'},
            'has_pinned_data': self._pinned_data is not None,
            'created_at': self.created_at.isoformat() + 'Z',
            'updated_at': self.updated_at.isoformat() + 'Z',
        }


class Edge(db.Model):
    __tablename__ = 'edges'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('edg'))
    pipeline_id = db.Column(db.String(20), db.ForeignKey('pipelines.id'), nullable=False)
    source_node_id = db.Column(db.String(20), nullable=False)
    target_node_id = db.Column(db.String(20), nullable=False)
    source_handle = db.Column(db.String(50), default='output')
    target_handle = db.Column(db.String(50), default='input')

    def to_dict(self):
        return {
            'id': self.id,
            'pipeline_id': self.pipeline_id,
            'source': self.source_node_id,
            'target': self.target_node_id,
            'sourceHandle': self.source_handle,
            'targetHandle': self.target_handle,
        }


class NodeType(db.Model):
    __tablename__ = 'node_types'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('ntp'))
    slug = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100))
    description = db.Column(db.Text)
    icon = db.Column(db.String(10))
    color = db.Column(db.String(10))
    inputs = db.Column(db.Integer, default=1)
    outputs = db.Column(db.Integer, default=1)
    _schema = db.Column('schema', db.Text, default='{}')

    @property
    def schema(self):
        return json.loads(self._schema or '{}')

    @schema.setter
    def schema(self, v):
        self._schema = json.dumps(v)

    def to_dict(self):
        return {
            'slug': self.slug,
            'name': self.name,
            'label': self.name,  # frontend expects `label`
            'category': self.category,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'inputs': self.inputs,
            'outputs': self.outputs,
        }


# ─────────────────────────────── RUNS ────────────────────────────────

class Run(db.Model):
    __tablename__ = 'runs'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('run'))
    pipeline_id = db.Column(db.String(20), db.ForeignKey('pipelines.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    trigger = db.Column(db.String(50), default='manual')
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    finished_at = db.Column(db.DateTime)
    _node_results = db.Column('node_results', db.Text, default='{}')
    error_message = db.Column(db.Text)

    logs = db.relationship('RunLog', backref='run', lazy=True, cascade='all, delete-orphan')
    exports = db.relationship('Export', backref='run', lazy=True, cascade='all, delete-orphan')

    @property
    def node_results(self):
        return json.loads(self._node_results or '{}')

    @node_results.setter
    def node_results(self, v):
        self._node_results = json.dumps(v)

    @property
    def duration_ms(self):
        if self.finished_at and self.started_at:
            return int((self.finished_at - self.started_at).total_seconds() * 1000)
        return None

    def to_dict(self, include_results=False):
        d = {
            'id': self.id,
            'pipeline_id': self.pipeline_id,
            'status': self.status,
            'trigger': self.trigger,
            'started_at': self.started_at.isoformat() + 'Z' if self.started_at else None,
            'finished_at': self.finished_at.isoformat() + 'Z' if self.finished_at else None,
            'duration_ms': self.duration_ms,
            'error_message': self.error_message,
        }
        if include_results:
            d['node_results'] = self.node_results
        return d


class RunLog(db.Model):
    __tablename__ = 'run_logs'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('log'))
    run_id = db.Column(db.String(20), db.ForeignKey('runs.id'), nullable=False)
    node_id = db.Column(db.String(20))
    level = db.Column(db.String(10), default='info')
    message = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'run_id': self.run_id,
            'node_id': self.node_id,
            'level': self.level,
            'message': self.message,
            'timestamp': self.timestamp.isoformat() + 'Z',
        }


class Export(db.Model):
    """A materialized export produced by a `file_export` node (or an explicit
    export request). Persisted in the DB so it survives restarts and is shared
    across all workers — unlike the previous in-memory store."""
    __tablename__ = 'exports'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('exp'))
    run_id = db.Column(db.String(20), db.ForeignKey('runs.id'), nullable=False)
    pipeline_id = db.Column(db.String(20), db.ForeignKey('pipelines.id'))
    node_id = db.Column(db.String(20))
    filename = db.Column(db.String(255))
    format = db.Column(db.String(20), default='csv')
    path = db.Column(db.String(500))
    rows = db.Column(db.Integer, default=0)
    size = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'run_id': self.run_id,
            'pipeline_id': self.pipeline_id,
            'node_id': self.node_id,
            'filename': self.filename,
            'format': self.format,
            'rows': self.rows,
            'size': self.size,
            'status': self.status,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'download_url': f'/api/v1/exports/{self.id}/download',
        }


# ─────────────────────────────── FILES & DATASOURCES ─────────────────

class File(db.Model):
    __tablename__ = 'files'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('fil'))
    workspace_id = db.Column(db.String(20), db.ForeignKey('workspaces.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255))
    size = db.Column(db.Integer, default=0)
    mime_type = db.Column(db.String(100))
    path = db.Column(db.String(500))
    rows_count = db.Column(db.Integer)
    columns_count = db.Column(db.Integer)
    _preview = db.Column('preview', db.Text)
    _columns = db.Column('columns', db.Text, default='[]')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def preview(self):
        return json.loads(self._preview) if self._preview else []

    @preview.setter
    def preview(self, v):
        self._preview = json.dumps(v)

    @property
    def columns(self):
        return json.loads(self._columns or '[]')

    @columns.setter
    def columns(self, v):
        self._columns = json.dumps(v)

    def to_dict(self):
        return {
            'id': self.id,
            'workspace_id': self.workspace_id,
            'name': self.name,
            'original_name': self.original_name,
            'size': self.size,
            'mime_type': self.mime_type,
            'rows_count': self.rows_count,
            'columns_count': self.columns_count,
            'columns': self.columns,
            'created_at': self.created_at.isoformat() + 'Z',
        }


class Datasource(db.Model):
    __tablename__ = 'datasources'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('ds'))
    workspace_id = db.Column(db.String(20), db.ForeignKey('workspaces.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    _config = db.Column('config', db.Text, default='{}')
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_synced_at = db.Column(db.DateTime)
    sync_status = db.Column(db.String(20), default='idle')

    @property
    def config(self):
        return json.loads(self._config or '{}')

    @config.setter
    def config(self, v):
        self._config = json.dumps(v)

    def to_dict(self):
        cfg = self.config.copy()
        cfg.pop('password', None)
        cfg.pop('api_key', None)
        return {
            'id': self.id,
            'workspace_id': self.workspace_id,
            'type': self.type,
            'name': self.name,
            'config': cfg,
            'active': self.active,
            'sync_status': self.sync_status,
            'last_synced_at': self.last_synced_at.isoformat() + 'Z' if self.last_synced_at else None,
            'created_at': self.created_at.isoformat() + 'Z',
        }


# ─────────────────────────────── SCHEDULING ──────────────────────────

class Schedule(db.Model):
    __tablename__ = 'schedules'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('sch'))
    pipeline_id = db.Column(db.String(20), db.ForeignKey('pipelines.id'), nullable=False, unique=True)
    cron = db.Column(db.String(100), nullable=False)
    timezone = db.Column(db.String(100), default='UTC')
    active = db.Column(db.Boolean, default=True)
    next_run_at = db.Column(db.DateTime)
    last_run_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'pipeline_id': self.pipeline_id,
            'cron': self.cron,
            'timezone': self.timezone,
            'active': self.active,
            'next_run_at': self.next_run_at.isoformat() + 'Z' if self.next_run_at else None,
            'last_run_at': self.last_run_at.isoformat() + 'Z' if self.last_run_at else None,
            'created_at': self.created_at.isoformat() + 'Z',
        }


# ─────────────────────────────── WEBHOOKS ────────────────────────────

class Webhook(db.Model):
    __tablename__ = 'webhooks'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('wh'))
    pipeline_id = db.Column(db.String(20), db.ForeignKey('pipelines.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    _events = db.Column('events', db.Text, default='["run.success","run.error"]')
    secret = db.Column(db.String(100))
    active = db.Column(db.Boolean, default=True)
    inbound_token = db.Column(db.String(100), unique=True, default=lambda: uuid4().hex)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    events_list = db.relationship('WebhookEvent', backref='webhook', lazy=True)

    @property
    def events(self):
        return json.loads(self._events or '[]')

    @events.setter
    def events(self, v):
        self._events = json.dumps(v)

    def to_dict(self):
        return {
            'id': self.id,
            'pipeline_id': self.pipeline_id,
            'url': self.url,
            'events': self.events,
            'active': self.active,
            'inbound_token': self.inbound_token,
            'created_at': self.created_at.isoformat() + 'Z',
        }


class WebhookEvent(db.Model):
    __tablename__ = 'webhook_events'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('whe'))
    webhook_id = db.Column(db.String(20), db.ForeignKey('webhooks.id'), nullable=False)
    event_type = db.Column(db.String(100))
    _payload = db.Column('payload', db.Text, default='{}')
    status = db.Column(db.String(20), default='pending')
    response_code = db.Column(db.Integer)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def payload(self):
        return json.loads(self._payload or '{}')

    def to_dict(self):
        return {
            'id': self.id,
            'webhook_id': self.webhook_id,
            'event_type': self.event_type,
            'status': self.status,
            'response_code': self.response_code,
            'sent_at': self.sent_at.isoformat() + 'Z',
        }


# ─────────────────────────────── NOTIFICATIONS & ALERTS ──────────────

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('ntf'))
    user_id = db.Column(db.String(20), db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50))
    title = db.Column(db.String(255))
    message = db.Column(db.Text)
    read = db.Column(db.Boolean, default=False)
    _meta = db.Column('meta', db.Text, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'read': self.read,
            'created_at': self.created_at.isoformat() + 'Z',
        }


class Alert(db.Model):
    __tablename__ = 'alerts'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('alr'))
    pipeline_id = db.Column(db.String(20), db.ForeignKey('pipelines.id'))
    name = db.Column(db.String(255), nullable=False)
    condition = db.Column(db.String(100))
    channel = db.Column(db.String(50), default='email')
    _recipients = db.Column('recipients', db.Text, default='[]')
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def recipients(self):
        return json.loads(self._recipients or '[]')

    def to_dict(self):
        return {
            'id': self.id,
            'pipeline_id': self.pipeline_id,
            'name': self.name,
            'condition': self.condition,
            'channel': self.channel,
            'recipients': self.recipients,
            'active': self.active,
            'created_at': self.created_at.isoformat() + 'Z',
        }


# ─────────────────────────────── AUDIT / ANALYTICS ───────────────────

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('aud'))
    user_id = db.Column(db.String(20), db.ForeignKey('users.id'))
    org_id = db.Column(db.String(20))
    action = db.Column(db.String(100))
    resource_type = db.Column(db.String(50))
    resource_id = db.Column(db.String(50))
    _metadata = db.Column('metadata', db.Text, default='{}')
    ip = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'org_id': self.org_id,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'ip': self.ip,
            'created_at': self.created_at.isoformat() + 'Z',
        }


# ─────────────────────────────── API KEYS & INTEGRATIONS ─────────────

class ApiKey(db.Model):
    __tablename__ = 'api_keys'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('key'))
    user_id = db.Column(db.String(20), db.ForeignKey('users.id'), nullable=False)
    org_id = db.Column(db.String(20))
    name = db.Column(db.String(255), nullable=False)
    key_prefix = db.Column(db.String(10))
    key_hash = db.Column(db.String(255))
    last_used_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'key_prefix': f"{self.key_prefix}...",
            'last_used_at': self.last_used_at.isoformat() + 'Z' if self.last_used_at else None,
            'created_at': self.created_at.isoformat() + 'Z',
        }


class Integration(db.Model):
    __tablename__ = 'integrations'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('int'))
    org_id = db.Column(db.String(20), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    _config = db.Column('config', db.Text, default='{}')
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def config(self):
        return json.loads(self._config or '{}')

    def to_dict(self):
        return {
            'id': self.id,
            'org_id': self.org_id,
            'type': self.type,
            'name': self.name,
            'active': self.active,
            'created_at': self.created_at.isoformat() + 'Z',
        }


# ─────────────────────────────── MARKETPLACE ─────────────────────────

class MarketplaceNode(db.Model):
    __tablename__ = 'marketplace_nodes'
    id = db.Column(db.String(20), primary_key=True, default=lambda: gen_id('mkn'))
    slug = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255))
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    icon = db.Column(db.String(10), default='🔌')
    version = db.Column(db.String(20), default='1.0.0')
    downloads = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, default=0.0)
    _schema = db.Column('schema', db.Text, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'slug': self.slug,
            'name': self.name,
            'author': self.author,
            'description': self.description,
            'category': self.category,
            'icon': self.icon,
            'version': self.version,
            'downloads': self.downloads,
            'rating': self.rating,
        }


# ─────────────────────────────── TELEGRAM BOT ────────────────────────────

class BotChat(db.Model):
    """Lie un chat Telegram à un compte DataPipe + état (pipeline courant, alerte, planning)."""
    __tablename__ = 'bot_chats'
    chat_id = db.Column(db.String(40), primary_key=True)
    user_id = db.Column(db.String(20), db.ForeignKey('users.id'))  # None tant que pas de /login
    current_pipeline_id = db.Column(db.String(20))
    anomaly_threshold = db.Column(db.Integer)        # alerte si anomalies > seuil (None = off)
    schedule_minutes = db.Column(db.Integer)         # exécution récurrente (None = off)
    next_run_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ─────────────────────────────── SEED DATA ───────────────────────────

NODE_TYPES_DATA = [
    {'slug': 'csv_reader', 'name': 'CSV Reader', 'category': 'Input', 'description': 'Read data from a CSV file', 'icon': '📄', 'color': '#22c55e', 'inputs': 0, 'outputs': 1,
     'schema': {'properties': {'file_id': {'type': 'string', 'title': 'File ID'}, 'delimiter': {'type': 'string', 'default': ','}, 'has_header': {'type': 'boolean', 'default': True}, 'encoding': {'type': 'string', 'default': 'utf-8'}}}},
    {'slug': 'json_reader', 'name': 'JSON Reader', 'category': 'Input', 'description': 'Read data from a JSON file', 'icon': '📋', 'color': '#22c55e', 'inputs': 0, 'outputs': 1,
     'schema': {'properties': {'file_id': {'type': 'string'}, 'path': {'type': 'string', 'description': 'JSONPath expression'}}}},
    {'slug': 'sql_query', 'name': 'SQL Query', 'category': 'Input', 'description': 'Execute a SQL query on a datasource', 'icon': '🗄️', 'color': '#3b82f6', 'inputs': 0, 'outputs': 1,
     'schema': {'properties': {'datasource_id': {'type': 'string'}, 'query': {'type': 'string', 'format': 'sql'}, 'limit': {'type': 'integer', 'default': 1000}}}},
    {'slug': 'http_request', 'name': 'HTTP Request', 'category': 'Input', 'description': 'Fetch data from an HTTP API', 'icon': '🌐', 'color': '#8b5cf6', 'inputs': 0, 'outputs': 1,
     'schema': {'properties': {'url': {'type': 'string', 'format': 'uri'}, 'method': {'type': 'string', 'enum': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']}, 'headers': {'type': 'object'}, 'body': {'type': 'object'}}}},
    {'slug': 'filter', 'name': 'Filter', 'category': 'Transform', 'description': 'Filter rows based on conditions', 'icon': '🔍', 'color': '#f59e0b', 'inputs': 1, 'outputs': 1,
     'schema': {'properties': {'conditions': {'type': 'array', 'items': {'type': 'object', 'properties': {'field': {'type': 'string'}, 'operator': {'type': 'string', 'enum': ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'contains', 'is_null', 'is_not_null']}, 'value': {}}}}, 'logic': {'type': 'string', 'enum': ['AND', 'OR'], 'default': 'AND'}}}},
    {'slug': 'map', 'name': 'Map / Rename', 'category': 'Transform', 'description': 'Transform and rename columns', 'icon': '🔄', 'color': '#f59e0b', 'inputs': 1, 'outputs': 1,
     'schema': {'properties': {'mappings': {'type': 'array', 'items': {'type': 'object', 'properties': {'source': {'type': 'string'}, 'target': {'type': 'string'}, 'expression': {'type': 'string'}}}}}}},
    {'slug': 'aggregate', 'name': 'Aggregate', 'category': 'Transform', 'description': 'Group and aggregate data', 'icon': '📊', 'color': '#f59e0b', 'inputs': 1, 'outputs': 1,
     'schema': {'properties': {'group_by': {'type': 'array', 'items': {'type': 'string'}}, 'aggregations': {'type': 'array', 'items': {'type': 'object', 'properties': {'field': {'type': 'string'}, 'function': {'type': 'string', 'enum': ['sum', 'avg', 'min', 'max', 'count', 'count_distinct']}, 'alias': {'type': 'string'}}}}}}},
    {'slug': 'join', 'name': 'Join', 'category': 'Transform', 'description': 'Join two data streams', 'icon': '🔗', 'color': '#f59e0b', 'inputs': 2, 'outputs': 1,
     'schema': {'properties': {'join_type': {'type': 'string', 'enum': ['inner', 'left', 'right', 'full']}, 'left_key': {'type': 'string'}, 'right_key': {'type': 'string'}}}},
    {'slug': 'sort', 'name': 'Sort', 'category': 'Transform', 'description': 'Sort rows by columns', 'icon': '↕️', 'color': '#f59e0b', 'inputs': 1, 'outputs': 1,
     'schema': {'properties': {'sort_by': {'type': 'array', 'items': {'type': 'object', 'properties': {'field': {'type': 'string'}, 'direction': {'type': 'string', 'enum': ['asc', 'desc']}}}}}}},
    {'slug': 'dedup', 'name': 'Deduplicate', 'category': 'Transform', 'description': 'Remove duplicate rows', 'icon': '🗑️', 'color': '#f59e0b', 'inputs': 1, 'outputs': 1,
     'schema': {'properties': {'keys': {'type': 'array', 'items': {'type': 'string'}}, 'keep': {'type': 'string', 'enum': ['first', 'last'], 'default': 'first'}}}},
    {'slug': 'sql_transform', 'name': 'SQL Transform', 'category': 'Transform', 'description': 'Transform data using SQL', 'icon': '💾', 'color': '#f59e0b', 'inputs': 1, 'outputs': 1,
     'schema': {'properties': {'query': {'type': 'string', 'format': 'sql', 'description': 'Use {input} to reference the input dataset'}}}},
    {'slug': 'ai_transform', 'name': 'AI Transform', 'category': 'AI', 'description': 'Transform data using AI', 'icon': '🤖', 'color': '#ec4899', 'inputs': 1, 'outputs': 1,
     'schema': {'properties': {'instruction': {'type': 'string', 'description': 'Natural language instruction for the transformation'}, 'model': {'type': 'string', 'default': 'gpt-4o-mini'}}}},
    {'slug': 'validate', 'name': 'Validate', 'category': 'Transform', 'description': 'Validate data against a schema', 'icon': '✅', 'color': '#f59e0b', 'inputs': 1, 'outputs': 2,
     'schema': {'properties': {'rules': {'type': 'array', 'items': {'type': 'object', 'properties': {'field': {'type': 'string'}, 'type': {'type': 'string'}, 'required': {'type': 'boolean'}}}}}}},
    {'slug': 'mask_pii', 'name': 'Masquer données sensibles', 'category': 'Banque', 'description': 'Anonymise les colonnes sensibles (nom, compte, téléphone, email)', 'icon': '🛡️', 'color': '#0ea5e9', 'inputs': 1, 'outputs': 1,
     'schema': {'properties': {'auto': {'type': 'boolean', 'default': True, 'title': 'Détection automatique'}, 'fields': {'type': 'array', 'items': {'type': 'object', 'properties': {'field': {'type': 'string'}, 'strategy': {'type': 'string', 'enum': ['name_initials', 'account_tail', 'phone_middle', 'email', 'hash']}}}}}}},
    {'slug': 'detect_anomalies', 'name': 'Détecter anomalies', 'category': 'Banque', 'description': 'Marque les transactions atypiques (z-score, seuil, montant négatif)', 'icon': '🚨', 'color': '#0ea5e9', 'inputs': 1, 'outputs': 1,
     'schema': {'properties': {'field': {'type': 'string', 'default': 'montant'}, 'method': {'type': 'string', 'enum': ['zscore', 'threshold', 'negative', 'all'], 'default': 'all'}, 'threshold': {'type': 'number', 'default': 5000000}, 'z': {'type': 'number', 'default': 3}}}},
    {'slug': 'quality_report', 'name': 'Rapport qualité', 'category': 'Banque', 'description': 'Calcule un score qualité réel (nulls, doublons) sur les données', 'icon': '📈', 'color': '#0ea5e9', 'inputs': 1, 'outputs': 1,
     'schema': {}},
    {'slug': 'sql_write', 'name': 'SQL Write', 'category': 'Output', 'description': 'Write data to a SQL database', 'icon': '📥', 'color': '#ef4444', 'inputs': 1, 'outputs': 0,
     'schema': {'properties': {'datasource_id': {'type': 'string'}, 'table': {'type': 'string'}, 'mode': {'type': 'string', 'enum': ['insert', 'upsert', 'replace'], 'default': 'insert'}, 'primary_keys': {'type': 'array', 'items': {'type': 'string'}}}}},
    {'slug': 'file_export', 'name': 'File Export', 'category': 'Output', 'description': 'Export data to a file', 'icon': '📤', 'color': '#ef4444', 'inputs': 1, 'outputs': 0,
     'schema': {'properties': {'format': {'type': 'string', 'enum': ['csv', 'json', 'excel', 'parquet']}, 'filename': {'type': 'string'}}}},
    {'slug': 'webhook_send', 'name': 'Send Webhook', 'category': 'Output', 'description': 'Send data to a webhook URL', 'icon': '📡', 'color': '#ef4444', 'inputs': 1, 'outputs': 0,
     'schema': {'properties': {'url': {'type': 'string', 'format': 'uri'}, 'method': {'type': 'string', 'default': 'POST'}, 'headers': {'type': 'object'}}}},
    {'slug': 'notification_send', 'name': 'Send Notification', 'category': 'Output', 'description': 'Send a notification on run completion', 'icon': '🔔', 'color': '#ef4444', 'inputs': 1, 'outputs': 0,
     'schema': {'properties': {'channel': {'type': 'string', 'enum': ['email', 'slack', 'sms']}, 'recipients': {'type': 'array', 'items': {'type': 'string'}}, 'message': {'type': 'string'}}}},
    {'slug': 'merge', 'name': 'Merge', 'category': 'Control', 'description': 'Merge multiple input streams into one', 'icon': '⬇️', 'color': '#06b6d4', 'inputs': 4, 'outputs': 1,
     'schema': {}},
    {'slug': 'split', 'name': 'Split', 'category': 'Control', 'description': 'Split one stream into multiple outputs', 'icon': '⬆️', 'color': '#06b6d4', 'inputs': 1, 'outputs': 4,
     'schema': {'properties': {'strategy': {'type': 'string', 'enum': ['round_robin', 'condition', 'copy']}, 'conditions': {'type': 'array'}}}},
    {'slug': 'schedule_trigger', 'name': 'Schedule Trigger', 'category': 'Trigger', 'description': 'Trigger pipeline on a cron schedule', 'icon': '⏰', 'color': '#10b981', 'inputs': 0, 'outputs': 1,
     'schema': {'properties': {'cron': {'type': 'string'}, 'timezone': {'type': 'string', 'default': 'UTC'}}}},
]

MARKETPLACE_NODES_DATA = [
    {'slug': 'stripe_reader', 'name': 'Stripe Reader', 'author': 'DataPipe Team', 'description': 'Read transactions from Stripe API', 'category': 'FinTech', 'icon': '💳', 'version': '1.2.0', 'downloads': 4521, 'rating': 4.8},
    {'slug': 'cinetpay_reader', 'name': 'CinetPay Reader', 'author': 'Community', 'description': 'Read transactions from CinetPay', 'category': 'FinTech', 'icon': '📱', 'version': '1.0.1', 'downloads': 1234, 'rating': 4.5},
    {'slug': 'anomaly_detector', 'name': 'Anomaly Detector', 'author': 'DataPipe AI', 'description': 'ML-powered anomaly detection for financial data', 'category': 'AI', 'icon': '🚨', 'version': '2.1.0', 'downloads': 8902, 'rating': 4.9},
    {'slug': 'pgsql_writer', 'name': 'PostgreSQL Writer', 'author': 'DataPipe Team', 'description': 'Write data to PostgreSQL with conflict resolution', 'category': 'Database', 'icon': '🐘', 'version': '1.5.0', 'downloads': 12400, 'rating': 4.7},
    {'slug': 'excel_reader', 'name': 'Excel Reader', 'author': 'Community', 'description': 'Read .xlsx files with sheet selection', 'category': 'Input', 'icon': '📊', 'version': '1.1.0', 'downloads': 6700, 'rating': 4.4},
    {'slug': 'slack_notify', 'name': 'Slack Notify', 'author': 'DataPipe Team', 'description': 'Send pipeline results to Slack channels', 'category': 'Output', 'icon': '💬', 'version': '1.3.0', 'downloads': 9100, 'rating': 4.6},
    {'slug': 'data_profiler', 'name': 'Data Profiler', 'author': 'Community', 'description': 'Generate statistics and quality report', 'category': 'Analysis', 'icon': '📈', 'version': '1.0.0', 'downloads': 3200, 'rating': 4.3},
    {'slug': 'currency_convert', 'name': 'Currency Converter', 'author': 'FinPipe Labs', 'description': 'Convert amounts between currencies using live rates', 'category': 'FinTech', 'icon': '💱', 'version': '2.0.0', 'downloads': 5600, 'rating': 4.7},
]

TEMPLATES_DATA = [
    {
        'name': 'CSV vers SQL',
        'description': 'Importer un fichier CSV et l\'écrire dans une base SQL',
        'category': 'Import',
        'icon': '📄',
        'nodes': [
            {'id': 'n1', 'type': 'csv_reader', 'label': 'Lire CSV', 'position': {'x': 100, 'y': 200}},
            {'id': 'n2', 'type': 'validate', 'label': 'Valider', 'position': {'x': 350, 'y': 200}},
            {'id': 'n3', 'type': 'sql_write', 'label': 'Écrire en base', 'position': {'x': 600, 'y': 200}},
        ],
        'edges': [
            {'id': 'e1', 'source': 'n1', 'target': 'n2'},
            {'id': 'e2', 'source': 'n2', 'target': 'n3'},
        ],
    },
    {
        'name': 'Détection d\'anomalies bancaires',
        'description': 'Analyser les transactions et détecter les anomalies avec l\'IA',
        'category': 'FinTech',
        'icon': '🏦',
        'nodes': [
            {'id': 'n1', 'type': 'sql_query', 'label': 'Lire transactions', 'position': {'x': 100, 'y': 200}},
            {'id': 'n2', 'type': 'filter', 'label': 'Filtrer actives', 'position': {'x': 350, 'y': 200}},
            {'id': 'n3', 'type': 'ai_transform', 'label': 'Détecter anomalies', 'position': {'x': 600, 'y': 200}},
            {'id': 'n4', 'type': 'notification_send', 'label': 'Alerter équipe', 'position': {'x': 850, 'y': 200}},
        ],
        'edges': [
            {'id': 'e1', 'source': 'n1', 'target': 'n2'},
            {'id': 'e2', 'source': 'n2', 'target': 'n3'},
            {'id': 'e3', 'source': 'n3', 'target': 'n4'},
        ],
    },
    {
        'name': 'Rapprochement bancaire',
        'description': 'Comparer deux fichiers de transactions et identifier les écarts',
        'category': 'FinTech',
        'icon': '⚖️',
        'nodes': [
            {'id': 'n1', 'type': 'csv_reader', 'label': 'Fichier banque', 'position': {'x': 100, 'y': 100}},
            {'id': 'n2', 'type': 'csv_reader', 'label': 'Fichier comptabilité', 'position': {'x': 100, 'y': 350}},
            {'id': 'n3', 'type': 'join', 'label': 'Rapprocher', 'position': {'x': 400, 'y': 225}},
            {'id': 'n4', 'type': 'filter', 'label': 'Écarts seulement', 'position': {'x': 650, 'y': 225}},
            {'id': 'n5', 'type': 'file_export', 'label': 'Export rapport', 'position': {'x': 900, 'y': 225}},
        ],
        'edges': [
            {'id': 'e1', 'source': 'n1', 'target': 'n3'},
            {'id': 'e2', 'source': 'n2', 'target': 'n3'},
            {'id': 'e3', 'source': 'n3', 'target': 'n4'},
            {'id': 'e4', 'source': 'n4', 'target': 'n5'},
        ],
    },
    {
        'name': 'ETL Agrégation mensuelle',
        'description': 'Agréger les transactions par mois et catégorie',
        'category': 'Analytics',
        'icon': '📊',
        'nodes': [
            {'id': 'n1', 'type': 'sql_query', 'label': 'Extraire données', 'position': {'x': 100, 'y': 200}},
            {'id': 'n2', 'type': 'map', 'label': 'Nettoyer colonnes', 'position': {'x': 350, 'y': 200}},
            {'id': 'n3', 'type': 'aggregate', 'label': 'Agréger par mois', 'position': {'x': 600, 'y': 200}},
            {'id': 'n4', 'type': 'sql_write', 'label': 'Écrire rapport', 'position': {'x': 850, 'y': 200}},
        ],
        'edges': [
            {'id': 'e1', 'source': 'n1', 'target': 'n2'},
            {'id': 'e2', 'source': 'n2', 'target': 'n3'},
            {'id': 'e3', 'source': 'n3', 'target': 'n4'},
        ],
    },
]


def seed_node_types():
    for nt_data in NODE_TYPES_DATA:
        if not NodeType.query.filter_by(slug=nt_data['slug']).first():
            schema = nt_data.pop('schema', {})
            nt = NodeType(**nt_data)
            nt.schema = schema
            db.session.add(nt)
    db.session.commit()


def seed_marketplace_nodes():
    for mn_data in MARKETPLACE_NODES_DATA:
        if not MarketplaceNode.query.filter_by(slug=mn_data['slug']).first():
            mn = MarketplaceNode(**mn_data)
            db.session.add(mn)
    db.session.commit()


def seed_templates():
    for tpl_data in TEMPLATES_DATA:
        if not PipelineTemplate.query.filter_by(name=tpl_data['name']).first():
            nodes = tpl_data.pop('nodes', [])
            edges = tpl_data.pop('edges', [])
            tpl = PipelineTemplate(**tpl_data)
            tpl.nodes = nodes
            tpl.edges = edges
            db.session.add(tpl)
    db.session.commit()
