import type { Pipeline } from '@/types'
import type { Edge } from '@xyflow/react'
import { NODE_REGISTRY } from './nodeRegistry'

type DemoNode = {
  id: string
  type: string
  position: { x: number; y: number }
  data: { label: string; config: Record<string, unknown>; type_slug: string }
}

function makeNodeTypes() {
  return NODE_REGISTRY.map((n) => ({ slug: n.slug, label: n.label, category: n.category, description: n.description }))
}

function pipe(id: string, name: string): Pipeline {
  return { id, name, description: '', workspace_id: 'demo', status: 'active', nodes_count: 0 }
}

function n(id: string, slug: string, x: number, label: string, config: Record<string, unknown>): DemoNode {
  return { id, type: slug, position: { x, y: 200 }, data: { label, config, type_slug: slug } }
}

function chain(ids: string[]): Edge[] {
  return ids.slice(0, -1).map((src, i) => ({ id: `e${i}`, source: src, target: ids[i + 1] }))
}

// ── 1 · Analyse des ventes ───────────────────────────────────────────────
const salesNodes: DemoNode[] = [
  n('n1', 'csv_reader', 40,  'Ventes 2024',  { file_id: 'ventes_2024.csv', delimiter: ',', has_header: true }),
  n('n2', 'filter',     220, 'Filtre',       { logic: 'AND', conditions: [{ field: 'montant', operator: 'gt', value: '500' }] }),
  n('n3', 'aggregate',  400, 'Agrégation',   { group_by: ['région'], aggregations: [{ field: 'montant', function: 'sum', alias: 'CA' }] }),
  n('n4', 'chart',      580, 'Graphique',    { chart_type: 'bar', x_column: 'région', y_column: 'CA', title: 'CA par région' }),
]

// ── 2 · Nettoyage CRM ─────────────────────────────────────────────────────
const crmNodes: DemoNode[] = [
  n('n1', 'json_reader',  40,  'Clients',     { file_id: 'clients.json', path: '$.data[*]' }),
  n('n2', 'dedup',        220, 'Dédoublon',   { keys: ['email'], keep: 'first' }),
  n('n3', 'map',          400, 'Renommage',   { mappings: [{ source: 'full_name', target: 'nom' }, { source: 'client_id', target: 'id' }] }),
  n('n4', 'file_export',  580, 'Export',      { format: 'csv', filename: 'crm_clean.csv' }),
]

// ── 3 · IA Transform ───────────────────────────────────────────────────────
const aiNodes: DemoNode[] = [
  n('n1', 'csv_reader',    40,  'Revenus Q4',   { file_id: 'revenus_q4.csv', delimiter: ';', has_header: true }),
  n('n2', 'ai_transform',  240, 'IA Transform', { instruction: 'Crée une colonne tranche_âge à partir de la colonne age (0-18, 19-35, 36-60, 60+)', model: 'gpt-4o-mini' }),
  n('n3', 'table_preview', 440, 'Aperçu',       { page_size: 50 }),
]

export const DEMO_PIPELINES_DATA: Record<string, {
  pipeline: Pipeline
  nodeTypes: ReturnType<typeof makeNodeTypes>
  nodes: DemoNode[]
  edges: Edge[]
}> = {
  'demo-sales': { pipeline: pipe('demo-sales', 'Analyse des ventes 2024'), nodeTypes: makeNodeTypes(), nodes: salesNodes, edges: chain(['n1', 'n2', 'n3', 'n4']) },
  'demo-crm':   { pipeline: pipe('demo-crm',   'Nettoyage CRM clients'),  nodeTypes: makeNodeTypes(), nodes: crmNodes,   edges: chain(['n1', 'n2', 'n3', 'n4']) },
  'demo-ai':    { pipeline: pipe('demo-ai',    'IA Transform — revenus'), nodeTypes: makeNodeTypes(), nodes: aiNodes,    edges: chain(['n1', 'n2', 'n3']) },
}
