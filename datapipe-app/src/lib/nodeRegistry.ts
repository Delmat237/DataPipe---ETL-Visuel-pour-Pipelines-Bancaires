/**
 * Single source of truth for node types — ALIGNED WITH THE BACKEND.
 *
 * The backend (`/node-types`) defines 20 real node types across 6 categories.
 * We add 2 front-end-only visualization nodes (table_preview, chart) that the
 * backend does not execute but the UI renders locally.
 *
 * Each node ships a declarative `fields` schema that drives the Inspector,
 * matching exactly the config keys the backend expects (see models.py).
 */

// ── Field schema (drives the dynamic Inspector) ─────────────────────────────
export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'sql'
  | 'textarea'
  | 'tags'        // string[]
  | 'list'        // array of objects (conditions, aggregations, mappings…)
  | 'file'        // file picker (workspace files)
  | 'kv'          // key/value object (headers)

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  help?: string
  default?: unknown
  options?: { value: string; label: string }[]   // for select
  itemFields?: FieldDef[]                          // for list
  itemLabel?: string                               // singular label for list rows
  optional?: boolean
}

// ── Shapes & categories ─────────────────────────────────────────────────────
export type NodeShape = 'input' | 'transform' | 'ai' | 'output' | 'control' | 'trigger' | 'viz'

export interface NodeDef {
  slug: string
  label: string
  category: string          // human label: Input, Transform, AI, Output, Control, Trigger, Visualisation
  shape: NodeShape
  icon: string              // lucide-react icon name
  description: string
  inputs: number
  outputs: number
  fields: FieldDef[]
  frontOnly?: boolean       // viz nodes the backend doesn't execute
  // legacy compat fields used by older callers
  color?: string
}

// ── Operator / function option lists (from backend schemas) ─────────────────
const FILTER_OPS: FieldDef['options'] = [
  { value: 'eq', label: '= égal' },
  { value: 'neq', label: '≠ différent' },
  { value: 'gt', label: '> supérieur' },
  { value: 'lt', label: '< inférieur' },
  { value: 'gte', label: '≥ sup. ou égal' },
  { value: 'lte', label: '≤ inf. ou égal' },
  { value: 'contains', label: 'contient' },
  { value: 'is_null', label: 'est vide' },
  { value: 'is_not_null', label: 'non vide' },
]

const AGG_FUNCS: FieldDef['options'] = [
  { value: 'sum', label: 'SUM' },
  { value: 'avg', label: 'AVG' },
  { value: 'min', label: 'MIN' },
  { value: 'max', label: 'MAX' },
  { value: 'count', label: 'COUNT' },
  { value: 'count_distinct', label: 'COUNT DISTINCT' },
]

// ── The registry ────────────────────────────────────────────────────────────
export const NODE_REGISTRY: NodeDef[] = [
  // ═══ INPUT ════════════════════════════════════════════════════════════════
  {
    slug: 'csv_reader', label: 'CSV Reader', category: 'Input', shape: 'input',
    icon: 'FileText', description: 'Lit un fichier CSV',
    inputs: 0, outputs: 1, color: '#22c55e',
    fields: [
      { key: 'file_id', label: 'Fichier', type: 'file', help: 'Fichier CSV uploadé dans le workspace' },
      { key: 'delimiter', label: 'Séparateur', type: 'text', default: ',', placeholder: ',' },
      { key: 'has_header', label: 'Première ligne = en-têtes', type: 'boolean', default: true },
      { key: 'encoding', label: 'Encodage', type: 'select', default: 'utf-8', options: [
        { value: 'utf-8', label: 'UTF-8' }, { value: 'latin-1', label: 'Latin-1' }, { value: 'utf-16', label: 'UTF-16' },
      ]},
    ],
  },
  {
    slug: 'json_reader', label: 'JSON Reader', category: 'Input', shape: 'input',
    icon: 'Braces', description: 'Lit un fichier JSON',
    inputs: 0, outputs: 1, color: '#22c55e',
    fields: [
      { key: 'file_id', label: 'Fichier', type: 'file', help: 'Fichier JSON uploadé' },
      { key: 'path', label: 'Chemin JSONPath', type: 'text', placeholder: '$.data[*]', optional: true, help: 'Expression JSONPath pour cibler les données' },
    ],
  },
  {
    slug: 'sql_query', label: 'SQL Query', category: 'Input', shape: 'input',
    icon: 'Database', description: 'Exécute une requête SQL sur une source',
    inputs: 0, outputs: 1, color: '#3b82f6',
    fields: [
      { key: 'datasource_id', label: 'Source de données', type: 'text', placeholder: 'ds_...', help: 'ID de la datasource connectée' },
      { key: 'query', label: 'Requête SQL', type: 'sql', placeholder: 'SELECT * FROM transactions' },
      { key: 'limit', label: 'Limite de lignes', type: 'number', default: 1000 },
    ],
  },
  {
    slug: 'http_request', label: 'HTTP Request', category: 'Input', shape: 'input',
    icon: 'Globe', description: 'Récupère des données via une API HTTP',
    inputs: 0, outputs: 1, color: '#8b5cf6',
    fields: [
      { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.exemple.com/data' },
      { key: 'method', label: 'Méthode', type: 'select', default: 'GET', options: [
        { value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' },
        { value: 'PATCH', label: 'PATCH' }, { value: 'DELETE', label: 'DELETE' },
      ]},
      { key: 'headers', label: 'En-têtes', type: 'kv', optional: true, help: 'Headers HTTP (clé / valeur)' },
      { key: 'body', label: 'Corps (JSON)', type: 'textarea', optional: true, placeholder: '{ "key": "value" }' },
    ],
  },

  // ═══ TRANSFORM ════════════════════════════════════════════════════════════
  {
    slug: 'filter', label: 'Filter', category: 'Transform', shape: 'transform',
    icon: 'Filter', description: 'Filtre les lignes selon des conditions',
    inputs: 1, outputs: 1, color: '#f59e0b',
    fields: [
      { key: 'logic', label: 'Logique', type: 'select', default: 'AND', options: [
        { value: 'AND', label: 'TOUTES les conditions (AND)' }, { value: 'OR', label: 'AU MOINS UNE (OR)' },
      ]},
      { key: 'conditions', label: 'Conditions', type: 'list', itemLabel: 'condition', itemFields: [
        { key: 'field', label: 'Colonne', type: 'text', placeholder: 'montant' },
        { key: 'operator', label: 'Opérateur', type: 'select', default: 'eq', options: FILTER_OPS },
        { key: 'value', label: 'Valeur', type: 'text', placeholder: '500' },
      ]},
    ],
  },
  {
    slug: 'map', label: 'Map / Rename', category: 'Transform', shape: 'transform',
    icon: 'Shuffle', description: 'Transforme et renomme les colonnes',
    inputs: 1, outputs: 1, color: '#f59e0b',
    fields: [
      { key: 'mappings', label: 'Correspondances', type: 'list', itemLabel: 'mapping', itemFields: [
        { key: 'source', label: 'Colonne source', type: 'text', placeholder: 'old_name' },
        { key: 'target', label: 'Nouvelle colonne', type: 'text', placeholder: 'new_name' },
        { key: 'expression', label: 'Expression', type: 'text', optional: true, placeholder: 'UPPER(source)' },
      ]},
    ],
  },
  {
    slug: 'aggregate', label: 'Aggregate', category: 'Transform', shape: 'transform',
    icon: 'Sigma', description: 'Groupe et agrège les données',
    inputs: 1, outputs: 1, color: '#f59e0b',
    fields: [
      { key: 'group_by', label: 'Grouper par', type: 'tags', placeholder: 'région, type', help: 'Colonnes de regroupement' },
      { key: 'aggregations', label: 'Agrégations', type: 'list', itemLabel: 'agrégation', itemFields: [
        { key: 'field', label: 'Colonne', type: 'text', placeholder: 'montant' },
        { key: 'function', label: 'Fonction', type: 'select', default: 'sum', options: AGG_FUNCS },
        { key: 'alias', label: 'Alias', type: 'text', optional: true, placeholder: 'total' },
      ]},
    ],
  },
  {
    slug: 'join', label: 'Join', category: 'Transform', shape: 'transform',
    icon: 'GitMerge', description: 'Joint deux flux de données',
    inputs: 2, outputs: 1, color: '#f59e0b',
    fields: [
      { key: 'join_type', label: 'Type de jointure', type: 'select', default: 'inner', options: [
        { value: 'inner', label: 'INNER' }, { value: 'left', label: 'LEFT' },
        { value: 'right', label: 'RIGHT' }, { value: 'full', label: 'FULL' },
      ]},
      { key: 'left_key', label: 'Clé gauche', type: 'text', placeholder: 'id' },
      { key: 'right_key', label: 'Clé droite', type: 'text', placeholder: 'user_id' },
    ],
  },
  {
    slug: 'sort', label: 'Sort', category: 'Transform', shape: 'transform',
    icon: 'ArrowDownUp', description: 'Trie les lignes par colonnes',
    inputs: 1, outputs: 1, color: '#f59e0b',
    fields: [
      { key: 'sort_by', label: 'Tris', type: 'list', itemLabel: 'tri', itemFields: [
        { key: 'field', label: 'Colonne', type: 'text', placeholder: 'date' },
        { key: 'direction', label: 'Sens', type: 'select', default: 'asc', options: [
          { value: 'asc', label: 'Croissant' }, { value: 'desc', label: 'Décroissant' },
        ]},
      ]},
    ],
  },
  {
    slug: 'dedup', label: 'Deduplicate', category: 'Transform', shape: 'transform',
    icon: 'CopyMinus', description: 'Supprime les lignes en double',
    inputs: 1, outputs: 1, color: '#f59e0b',
    fields: [
      { key: 'keys', label: 'Colonnes clés', type: 'tags', placeholder: 'id', help: 'Colonnes définissant un doublon' },
      { key: 'keep', label: 'Conserver', type: 'select', default: 'first', options: [
        { value: 'first', label: 'Première occurrence' }, { value: 'last', label: 'Dernière occurrence' },
      ]},
    ],
  },
  {
    slug: 'sql_transform', label: 'SQL Transform', category: 'Transform', shape: 'transform',
    icon: 'Terminal', description: 'Transforme les données en SQL',
    inputs: 1, outputs: 1, color: '#f59e0b',
    fields: [
      { key: 'query', label: 'Requête SQL', type: 'sql', placeholder: 'SELECT * FROM {input} WHERE montant > 500', help: 'Utilisez {input} pour référencer les données d\'entrée' },
    ],
  },
  {
    slug: 'validate', label: 'Validate', category: 'Transform', shape: 'transform',
    icon: 'CheckCheck', description: 'Valide les données selon des règles (2 sorties)',
    inputs: 1, outputs: 2, color: '#f59e0b',
    fields: [
      { key: 'rules', label: 'Règles', type: 'list', itemLabel: 'règle', itemFields: [
        { key: 'field', label: 'Colonne', type: 'text', placeholder: 'email' },
        { key: 'type', label: 'Type attendu', type: 'select', default: 'string', options: [
          { value: 'string', label: 'Texte' }, { value: 'integer', label: 'Entier' },
          { value: 'number', label: 'Nombre' }, { value: 'boolean', label: 'Booléen' },
        ]},
        { key: 'required', label: 'Obligatoire', type: 'boolean', default: true },
      ]},
    ],
  },

  // ═══ AI ═══════════════════════════════════════════════════════════════════
  {
    slug: 'ai_transform', label: 'AI Transform', category: 'AI', shape: 'ai',
    icon: 'Bot', description: 'Transforme les données via une instruction en langage naturel',
    inputs: 1, outputs: 1, color: '#ec4899',
    fields: [
      { key: 'instruction', label: 'Instruction', type: 'textarea', placeholder: 'Crée une colonne tranche_âge à partir de la colonne age (0-18, 19-35, 36-60, 60+)', help: 'Décrivez la transformation en français' },
      { key: 'model', label: 'Modèle', type: 'select', default: 'gpt-4o-mini', options: [
        { value: 'datapipe-analyst', label: 'DataPipe Analyst' },
        { value: 'gpt-4o-mini', label: 'Claude Sonnet (rapide)' },
        { value: 'gpt-4o', label: 'Claude Opus (avancé)' },
      ]},
    ],
  },

  // ═══ OUTPUT ═══════════════════════════════════════════════════════════════
  {
    slug: 'sql_write', label: 'SQL Write', category: 'Output', shape: 'output',
    icon: 'DatabaseZap', description: 'Écrit les données dans une base SQL',
    inputs: 1, outputs: 0, color: '#ef4444',
    fields: [
      { key: 'datasource_id', label: 'Source de données', type: 'text', placeholder: 'ds_...' },
      { key: 'table', label: 'Table', type: 'text', placeholder: 'résultats' },
      { key: 'mode', label: 'Mode', type: 'select', default: 'insert', options: [
        { value: 'insert', label: 'Insert' }, { value: 'upsert', label: 'Upsert' }, { value: 'replace', label: 'Replace' },
      ]},
      { key: 'primary_keys', label: 'Clés primaires', type: 'tags', optional: true, placeholder: 'id' },
    ],
  },
  {
    slug: 'file_export', label: 'File Export', category: 'Output', shape: 'output',
    icon: 'Download', description: 'Exporte les données dans un fichier',
    inputs: 1, outputs: 0, color: '#ef4444',
    fields: [
      { key: 'format', label: 'Format', type: 'select', default: 'csv', options: [
        { value: 'csv', label: 'CSV' }, { value: 'json', label: 'JSON' },
        { value: 'excel', label: 'Excel' }, { value: 'parquet', label: 'Parquet' },
      ]},
      { key: 'filename', label: 'Nom du fichier', type: 'text', placeholder: 'rapport.csv' },
    ],
  },
  {
    slug: 'webhook_send', label: 'Send Webhook', category: 'Output', shape: 'output',
    icon: 'Webhook', description: 'Envoie les données vers une URL webhook',
    inputs: 1, outputs: 0, color: '#ef4444',
    fields: [
      { key: 'url', label: 'URL', type: 'text', placeholder: 'https://hooks.exemple.com/...' },
      { key: 'method', label: 'Méthode', type: 'select', default: 'POST', options: [
        { value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' }, { value: 'PATCH', label: 'PATCH' },
      ]},
      { key: 'headers', label: 'En-têtes', type: 'kv', optional: true },
    ],
  },
  {
    slug: 'notification_send', label: 'Send Notification', category: 'Output', shape: 'output',
    icon: 'Bell', description: 'Envoie une notification en fin de run',
    inputs: 1, outputs: 0, color: '#ef4444',
    fields: [
      { key: 'channel', label: 'Canal', type: 'select', default: 'email', options: [
        { value: 'email', label: 'Email' }, { value: 'slack', label: 'Slack' }, { value: 'sms', label: 'SMS' },
      ]},
      { key: 'recipients', label: 'Destinataires', type: 'tags', placeholder: 'equipe@exemple.com' },
      { key: 'message', label: 'Message', type: 'textarea', optional: true, placeholder: 'Pipeline terminé avec succès' },
    ],
  },

  // ═══ CONTROL ══════════════════════════════════════════════════════════════
  {
    slug: 'merge', label: 'Merge', category: 'Control', shape: 'control',
    icon: 'Combine', description: 'Fusionne plusieurs flux en un seul',
    inputs: 4, outputs: 1, color: '#06b6d4',
    fields: [],
  },
  {
    slug: 'split', label: 'Split', category: 'Control', shape: 'control',
    icon: 'Split', description: 'Divise un flux en plusieurs sorties',
    inputs: 1, outputs: 4, color: '#06b6d4',
    fields: [
      { key: 'strategy', label: 'Stratégie', type: 'select', default: 'copy', options: [
        { value: 'round_robin', label: 'Round-robin' }, { value: 'condition', label: 'Par condition' }, { value: 'copy', label: 'Copie' },
      ]},
    ],
  },

  // ═══ TRIGGER ══════════════════════════════════════════════════════════════
  {
    slug: 'schedule_trigger', label: 'Schedule Trigger', category: 'Trigger', shape: 'trigger',
    icon: 'Clock', description: 'Déclenche le pipeline selon un cron',
    inputs: 0, outputs: 1, color: '#10b981',
    fields: [
      { key: 'cron', label: 'Expression cron', type: 'text', placeholder: '0 9 * * *', help: 'Format cron standard' },
      { key: 'timezone', label: 'Fuseau horaire', type: 'text', default: 'UTC', placeholder: 'Europe/Paris' },
    ],
  },

  // ═══ VISUALISATION (front-only) ═══════════════════════════════════════════
  {
    slug: 'table_preview', label: 'Table Preview', category: 'Visualisation', shape: 'viz',
    icon: 'Table2', description: 'Affiche un tableau paginé (visualisation locale)',
    inputs: 1, outputs: 0, color: '#f59e0b', frontOnly: true,
    fields: [
      { key: 'page_size', label: 'Lignes par page', type: 'number', default: 50 },
    ],
  },
  {
    slug: 'chart', label: 'Chart', category: 'Visualisation', shape: 'viz',
    icon: 'BarChart3', description: 'Génère un graphique (visualisation locale)',
    inputs: 1, outputs: 0, color: '#f59e0b', frontOnly: true,
    fields: [
      { key: 'chart_type', label: 'Type', type: 'select', default: 'bar', options: [
        { value: 'bar', label: 'Barres' }, { value: 'line', label: 'Lignes' },
        { value: 'pie', label: 'Camembert' }, { value: 'area', label: 'Aires' },
      ]},
      { key: 'x_column', label: 'Axe X', type: 'text', placeholder: 'région' },
      { key: 'y_column', label: 'Axe Y', type: 'text', placeholder: 'montant' },
      { key: 'title', label: 'Titre', type: 'text', optional: true, placeholder: 'Ventes par région' },
    ],
  },
]

export const NODE_REGISTRY_MAP: Record<string, NodeDef> = Object.fromEntries(
  NODE_REGISTRY.map((n) => [n.slug, n])
)

// Ordered categories for the drawer
export const CATEGORY_ORDER = ['Input', 'Transform', 'AI', 'Output', 'Control', 'Trigger', 'Visualisation']
