// ─── Auth & User ───────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  verified: boolean
  created_at: string
  orgs: OrgMembership[]
}

export interface OrgMembership {
  id: string
  name: string
  role: Role
}

export type Role = 'viewer' | 'editor' | 'admin' | 'owner'

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  user: {
    id: string
    name: string
    org_id: string
  }
}

export interface Session {
  id: string
  ip: string
  device: string
  created_at: string
  current: boolean
}

// ─── Organisation & Workspace ──────────────────────────────────────────────
export interface Organisation {
  id: string
  name: string
  slug: string
  plan: Plan
  storage_used_mb?: number
  members_count?: number
  settings?: OrgSettings
}

export type Plan = 'free' | 'pro' | 'enterprise'

export interface OrgSettings {
  allow_public_pipelines: boolean
  default_timezone: string
}

export interface Member {
  user_id: string
  name: string
  email?: string
  avatar_url?: string
  role: Role
  joined_at: string
}

export interface Workspace {
  id: string
  name: string
  description?: string
  color?: string
  pipelines_count?: number
}

// ─── Pipeline ──────────────────────────────────────────────────────────────
export interface Pipeline {
  id: string
  name: string
  description?: string
  workspace_id: string
  status: PipelineStatus
  nodes_count?: number
  tags?: string[]
  last_run_at?: string
  last_run_status?: RunStatus
  version?: number
  updated_at?: string
  nodes?: FlowNode[]
  edges?: FlowEdge[]
}

export type PipelineStatus = 'active' | 'archived' | 'deleted'

export interface PipelineVersion {
  id: string
  version: number
  author: string
  created_at: string
  nodes_count: number
  label?: string
}

export interface PipelineTemplate {
  id: string
  name: string
  description: string
  nodes_count: number
  category: string
  preview_url?: string
}

export interface Pagination {
  total: number
  page: number
  per_page: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}

// ─── Nodes & Edges (React Flow format) ────────────────────────────────────
export interface FlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: NodeData
  [key: string]: unknown
}

export interface NodeData {
  [key: string]: unknown
  label?: string
  config?: Record<string, unknown>
  status?: NodeStatus
  type_slug?: string
}

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped'

export interface FlowEdge {
  id: string
  source: string
  target: string
  source_handle?: string
  target_handle?: string
}

export interface NodeType {
  slug: string
  label: string
  category: NodeCategory
  color: string
  icon: string
  description: string
  inputs: number
  outputs: number
}

export type NodeCategory = 'source' | 'transform' | 'ai' | 'output' | 'logic'

export interface NodeTypeSchema {
  type: 'object'
  properties: Record<string, SchemaProperty>
  required?: string[]
}

export interface SchemaProperty {
  type: string
  title?: string
  description?: string
  enum?: string[]
  default?: unknown
  minimum?: number
  maximum?: number
}

// ─── Runs ──────────────────────────────────────────────────────────────────
export type RunStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled'

export interface Run {
  id: string
  status: RunStatus
  pipeline_id: string
  duration_ms?: number
  rows_processed?: number
  nodes_executed?: number
  started_at: string
  finished_at?: string
  triggered_by?: string
}

export interface NodeRun {
  node_id: string
  status: RunStatus
  duration_ms?: number
  rows_out?: number
  started_at?: string
}

export interface DataPreview {
  columns: string[]
  rows: unknown[][]
  total_rows: number
  truncated: boolean
}

export interface NodeStats {
  rows_in: number
  rows_out: number
  columns_count: number
  size_bytes: number
  duration_ms: number
  schema: Array<{ name: string; type: string }>
}

export interface LogEntry {
  level: 'INFO' | 'WARNING' | 'ERROR'
  ts: string
  node_id?: string
  msg: string
}

// ─── Files & Datasources ───────────────────────────────────────────────────
export interface DataFile {
  id: string
  name: string
  size_bytes: number
  rows?: number
  columns?: number
  schema?: ColumnSchema[]
  preview_url?: string
  created_at: string
}

export interface ColumnSchema {
  name: string
  type: ColumnType
  nullable?: boolean
  sample?: string
}

export type ColumnType = 'INTEGER' | 'FLOAT' | 'VARCHAR' | 'DATE' | 'TIMESTAMP' | 'BOOLEAN'

export interface Datasource {
  id: string
  name: string
  type: DatasourceType
  status: 'untested' | 'connected' | 'error'
  host?: string
  port?: number
  database?: string
  username?: string
}

export type DatasourceType = 'postgresql' | 'mysql' | 'sqlite' | 'bigquery' | 'snowflake'

export interface TableInfo {
  name: string
  schema: string
  rows_estimate?: number
}

// ─── Transforms ────────────────────────────────────────────────────────────
export interface FilterValidation {
  valid: boolean
  estimated_matches?: number
  total_rows?: number
  error?: string
}

export interface SQLValidation {
  valid: boolean
  query_type?: string
  referenced_columns?: string[]
  warnings?: string[]
  error?: string
}

export interface JoinPreview {
  match_count: number
  total_left: number
  total_right: number
  unmatched_left: number
  sample_rows: unknown[]
}

export interface DuckDBFunction {
  name: string
  category: string
  signature: string
  desc: string
}

// ─── AI ────────────────────────────────────────────────────────────────────
export interface GeneratedPipeline {
  pipeline: {
    nodes: Omit<FlowNode, 'id'>[]
    edges: Omit<FlowEdge, 'id'>[]
  }
  explanation: string
  tokens_used: number
}

export interface GeneratedSQL {
  sql: string
  explanation: string
  tokens_used: number
}

export interface ColumnSuggestion {
  column: string
  confidence: number
  reason: string
}

export interface JoinSuggestion {
  left: string
  right: string
  confidence: number
  reason: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  message: ChatMessage
  session_id: string
  tokens_used: number
}

export interface AIUsage {
  month: string
  tokens_used: number
  tokens_limit: number
  cost_usd: number
  breakdown: {
    generate_pipeline: number
    generate_sql: number
    chat: number
  }
}

// ─── Export ────────────────────────────────────────────────────────────────
export interface Export {
  id: string
  status: 'preparing' | 'ready' | 'failed'
  format: ExportFormat
  size_bytes?: number
  rows?: number
  download_url?: string
  expires_at?: string
}

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'parquet'

// ─── Scheduling ────────────────────────────────────────────────────────────
export interface Schedule {
  id: string
  name: string
  cron: string
  timezone?: string
  enabled: boolean
  next_run_at?: string
  notify_on_failure?: boolean
  status?: 'active' | 'paused'
}

// ─── Webhooks ──────────────────────────────────────────────────────────────
export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  active: boolean
  secret?: string
  created_at: string
}

export interface WebhookDelivery {
  id: string
  event: string
  status: number
  sent_at: string
  duration_ms: number
  error?: string
}

// ─── Notifications ─────────────────────────────────────────────────────────
export type NotificationType = 'run_failed' | 'run_success' | 'member_joined' | 'alert_triggered'

export interface Notification {
  id: string
  type: NotificationType
  read: boolean
  message: string
  created_at: string
  data?: Record<string, string>
}

// ─── Analytics ─────────────────────────────────────────────────────────────
export interface PipelineAnalytics {
  total_runs: number
  success_rate: number
  avg_duration_ms: number
  avg_rows_processed: number
  total_rows_processed: number
  last_run_at: string
}

export interface RunTrend {
  date: string
  runs: number
  success: number
  failed: number
}

export interface NodeBottleneck {
  node_id: string
  label: string
  avg_duration_ms: number
  rank: number
}

export interface WorkspaceUsage {
  storage_used_mb: number
  storage_limit_mb: number
  runs_this_month: number
  rows_processed_this_month: number
  active_pipelines: number
  scheduled_runs: number
}

// ─── API Keys & Integrations ───────────────────────────────────────────────
export interface ApiKey {
  id: string
  name: string
  prefix: string
  last_used_at?: string
  created_at: string
  scopes: string[]
}

export interface Integration {
  slug: string
  name: string
  status: 'available' | 'beta' | 'coming_soon'
  connected: boolean
  account?: string
}

// ─── System ────────────────────────────────────────────────────────────────
export interface SystemLimits {
  plan: Plan
  limits: {
    storage_mb: number
    storage_used_mb: number
    pipelines_max: number
    pipelines_used: number
    runs_per_month: number
    runs_used: number
    ai_tokens_per_month: number
    ai_tokens_used: number
    members_max: number
    members_used: number
  }
}

// ─── WebSocket Events ──────────────────────────────────────────────────────
export interface WSNodeStatusEvent {
  type: 'node_status'
  node_id: string
  status: RunStatus
  rows_out?: number
  duration_ms?: number
}

export interface WSRunCompleteEvent {
  type: 'run_complete'
  status: RunStatus
  total_duration_ms: number
}

export type WSEvent = WSNodeStatusEvent | WSRunCompleteEvent

// ─── API Error ─────────────────────────────────────────────────────────────
export interface ApiError {
  error: {
    code: string
    message: string
    status: number
    details?: Record<string, unknown>
  }
}
