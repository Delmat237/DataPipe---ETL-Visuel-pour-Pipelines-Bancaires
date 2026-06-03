// ─── Per-node config shapes ───────────────────────────────────────────────
// All optional so a fresh node starts unconfigured.

export interface CSVImportConfig {
  file_id?: string
  file_name?: string
  separator?: ',' | ';' | '\t' | '|'
  encoding?: 'utf-8' | 'latin-1' | 'utf-16'
  has_header?: boolean
}

export interface JSONLoaderConfig {
  file_id?: string
  file_name?: string
  source?: 'file' | 'url'
  url?: string
  root_path?: string  // e.g. "data.items"
}

export interface SQLQueryConfig {
  query?: string
  connection?: 'sqlite' | 'postgres' | 'mysql'
  connection_string?: string
}

export interface FilterConfig {
  column?: string
  operator?: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'not contains' | 'is null' | 'is not null'
  value?: string
}

export interface JoinConfig {
  left_key?: string
  right_key?: string
  join_type?: 'LEFT' | 'INNER' | 'RIGHT' | 'OUTER'
}

export interface AggregateConfig {
  group_by?: string[]
  aggregations?: Array<{ column: string; function: 'SUM' | 'COUNT' | 'AVG' | 'MAX' | 'MIN'; alias?: string }>
}

export interface RenameConfig {
  operations?: Array<
    | { op: 'rename'; from: string; to: string }
    | { op: 'drop'; column: string }
    | { op: 'select'; columns: string[] }
  >
}

export interface CleanConfig {
  remove_duplicates?: boolean
  drop_null_rows?: boolean
  fill_null_value?: string
  trim_strings?: boolean
  drop_columns_all_null?: boolean
}

export interface AITransformConfig {
  prompt?: string
  model?: 'claude-sonnet-4-6' | 'claude-haiku-4-5'
  generated_code?: string
}

export interface TablePreviewConfig {
  page_size?: number
  sort_column?: string
  sort_dir?: 'asc' | 'desc'
}

export interface ChartConfig {
  chart_type?: 'bar' | 'line' | 'pie' | 'area'
  x_axis?: string
  y_axis?: string
  color?: string
  title?: string
  show_legend?: boolean
}

export interface ExportConfig {
  format?: 'csv' | 'json'
  filename?: string
  include_index?: boolean
}

// ─── Node preview summary (shown inside the card) ────────────────────────
export interface NodePreview {
  rows_out?: number
  rows_in?: number
  message?: string  // e.g. "342 lignes retenues sur 1247"
  columns?: string[]
  error?: string
}
