'use client'

import {
  FileText, Braces, Database, Globe, Filter, Shuffle, Sigma, GitMerge,
  ArrowDownUp, CopyMinus, Terminal, CheckCheck, Bot, DatabaseZap, Download,
  Webhook, Bell, Combine, Split, Clock, Table2, BarChart3, Box,
  type LucideIcon,
} from 'lucide-react'
import { NODE_REGISTRY_MAP, type NodeShape } from '@/lib/nodeRegistry'

// Mêmes icônes/couleurs/formes que les vrais nœuds de l'éditeur
const ICONS: Record<string, LucideIcon> = {
  FileText, Braces, Database, Globe, Filter, Shuffle, Sigma, GitMerge,
  ArrowDownUp, CopyMinus, Terminal, CheckCheck, Bot, DatabaseZap, Download,
  Webhook, Bell, Combine, Split, Clock, Table2, BarChart3,
}

export const NODE_COLOR: Record<string, string> = {
  csv_reader: '#22c55e', json_reader: '#10b981', sql_query: '#3b82f6', http_request: '#8b5cf6',
  filter: '#f59e0b', map: '#ec4899', aggregate: '#f97316', join: '#14b8a6',
  sort: '#eab308', dedup: '#06b6d4', sql_transform: '#6366f1', validate: '#84cc16',
  ai_transform: '#a855f7',
  sql_write: '#ef4444', file_export: '#f43f5e', webhook_send: '#d946ef', notification_send: '#fb923c',
  merge: '#0ea5e9', split: '#2dd4bf',
  schedule_trigger: '#22d3ee',
  table_preview: '#fbbf24', chart: '#38bdf8',
}

function polyPoints(shape: NodeShape, W: number, M: number): number[][] | null {
  const c = 0.29 * W
  const off = (pts: number[][]) => pts.map(([x, y]) => [x + M, y + M])
  switch (shape) {
    case 'ai': return off([[c, 0], [W - c, 0], [W, c], [W, W - c], [W - c, W], [c, W], [0, W - c], [0, c]])
    case 'viz': return off([[W / 2, 0], [W, W * 0.27], [W, W * 0.73], [W / 2, W], [0, W * 0.73], [0, W * 0.27]])
    case 'control': return off([[W / 2, 0], [W, W / 2], [W / 2, W], [0, W / 2]])
    case 'output': return off([[0, 0], [W * 0.72, 0], [W, W / 2], [W * 0.72, W], [0, W]])
    default: return null
  }
}

function roundedPath(points: number[][], r: number): string {
  const n = points.length
  const dist = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1])
  const lerp = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  let d = ''
  for (let i = 0; i < n; i++) {
    const curr = points[i], prev = points[(i - 1 + n) % n], next = points[(i + 1) % n]
    const dPrev = dist(curr, prev), dNext = dist(curr, next)
    const p1 = lerp(curr, prev, Math.min(r, dPrev / 2) / dPrev)
    const p2 = lerp(curr, next, Math.min(r, dNext / 2) / dNext)
    d += `${i === 0 ? 'M' : 'L'} ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} `
    d += `Q ${curr[0].toFixed(2)} ${curr[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `
  }
  return d + 'Z'
}

function cssRadius(shape: NodeShape, size: number): string {
  switch (shape) {
    case 'input': return `${size / 2}px ${size * 0.17}px ${size * 0.17}px ${size / 2}px`
    case 'transform': return '10px'
    case 'trigger': return '50%'
    default: return '0'
  }
}

// ── Glyphe de nœud (forme + icône colorée), identique au visuel éditeur ──────
export function NodeGlyph({ slug, label, size = 64 }: { slug: string; label?: string; size?: number }) {
  const def = NODE_REGISTRY_MAP[slug]
  const Icon = (def && ICONS[def.icon]) ?? Box
  const shape = (def?.shape ?? 'transform') as NodeShape
  const color = NODE_COLOR[slug] ?? '#94a3b8'
  const name = label ?? def?.label ?? slug

  const M = 3.5
  const W = size - M * 2
  const poly = polyPoints(shape, W, M)
  const radius = shape === 'control' || shape === 'output' ? 5 : 8

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, width: size + 40 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {poly ? (
          <svg width={size} height={size} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <path d={roundedPath(poly, radius)} fill="#0f0f14" stroke="rgba(255,255,255,0.14)" strokeWidth={1.25} strokeLinejoin="round" />
          </svg>
        ) : (
          <div style={{ position: 'absolute', inset: 0, borderRadius: cssRadius(shape, size), background: '#0f0f14', border: '1.25px solid rgba(255,255,255,0.14)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={Math.round(size * 0.36)} strokeWidth={1.7} color={color} />
        </div>
      </div>
      {name && (
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textAlign: 'center', whiteSpace: 'nowrap' }}>{name}</span>
      )}
    </div>
  )
}

// ── Pipeline horizontal : glyphes reliés par des connecteurs + flèche ────────
export interface MiniStep { slug: string; label?: string }

export function MiniPipeline({ steps, size = 64, running = false }: { steps: MiniStep[]; size?: number; running?: boolean }) {
  return (
    <div className="flex items-start justify-center gap-0 flex-wrap">
      {steps.map((s, i) => (
        <div key={i} className="flex items-start">
          <NodeGlyph slug={s.slug} label={s.label} size={size} />
          {i < steps.length - 1 && (
            <div className="flex items-center" style={{ height: size, marginLeft: -18, marginRight: -18 }}>
              <div style={{ position: 'relative', width: 40, height: 2 }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 2,
                  background: running ? '#ff6d35' : 'rgba(255,255,255,0.18)',
                }} />
                {/* pointe de flèche */}
                <div style={{
                  position: 'absolute', right: -1, top: '50%', transform: 'translateY(-50%)',
                  width: 0, height: 0,
                  borderTop: '4px solid transparent', borderBottom: '4px solid transparent',
                  borderLeft: `6px solid ${running ? '#ff6d35' : 'rgba(255,255,255,0.3)'}`,
                }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
