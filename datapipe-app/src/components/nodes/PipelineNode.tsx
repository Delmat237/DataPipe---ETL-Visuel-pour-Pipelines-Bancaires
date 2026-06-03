'use client'

import { memo, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  FileText, Braces, Database, Globe, Filter, Shuffle, Sigma, GitMerge,
  ArrowDownUp, CopyMinus, Terminal, CheckCheck, Bot, DatabaseZap, Download,
  Webhook, Bell, Combine, Split, Clock, Table2, BarChart3, Plus, Box,
  Trash2, Power, MoreHorizontal, Eye, Play, Pencil, Copy,
  Pin, PinOff, FileCode2, RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { useEditorStore } from '@/store/editor.store'
import { useUIStore } from '@/store/ui.store'
import { nodesApi } from '@/lib/api/nodes'
import { NODE_REGISTRY_MAP, type NodeShape } from '@/lib/nodeRegistry'
import { toast } from 'sonner'
import type { NodeStatus } from '@/types'

const ICONS: Record<string, LucideIcon> = {
  FileText, Braces, Database, Globe, Filter, Shuffle, Sigma, GitMerge,
  ArrowDownUp, CopyMinus, Terminal, CheckCheck, Bot, DatabaseZap, Download,
  Webhook, Bell, Combine, Split, Clock, Table2, BarChart3,
}

// Couleur caractéristique par nœud (icône + fond légèrement teinté)
const NODE_COLOR: Record<string, string> = {
  csv_reader: '#22c55e', json_reader: '#10b981', sql_query: '#3b82f6', http_request: '#8b5cf6',
  filter: '#f59e0b', map: '#ec4899', aggregate: '#f97316', join: '#14b8a6',
  sort: '#eab308', dedup: '#06b6d4', sql_transform: '#6366f1', validate: '#84cc16',
  ai_transform: '#a855f7',
  sql_write: '#ef4444', file_export: '#f43f5e', webhook_send: '#d946ef', notification_send: '#fb923c',
  merge: '#0ea5e9', split: '#2dd4bf',
  schedule_trigger: '#22d3ee',
  table_preview: '#fbbf24', chart: '#38bdf8',
}


const EXEC: Record<string, string> = {
  running: 'rgba(255,109,53,0.95)',
  queued:  'rgba(59,130,246,0.9)',
  success: 'rgba(16,185,129,0.9)',
  error:   'rgba(239,68,68,0.9)',
  failed:  'rgba(239,68,68,0.9)',
}
const STATUS_DOT: Record<string, { bg: string; pulse: boolean }> = {
  running: { bg: '#ff6d35', pulse: true },
  queued:  { bg: '#3b82f6', pulse: true },
  success: { bg: '#10b981', pulse: false },
  error:   { bg: '#ef4444', pulse: false },
  failed:  { bg: '#ef4444', pulse: false },
}

const SIZE = 58
const M = 3
const W = SIZE - M * 2

function polyPoints(shape: NodeShape): number[][] | null {
  const c = 0.29 * W
  switch (shape) {
    case 'ai':
      return [[c, 0], [W - c, 0], [W, c], [W, W - c], [W - c, W], [c, W], [0, W - c], [0, c]].map(([x, y]) => [x + M, y + M])
    case 'viz':
      return [[W / 2, 0], [W, W * 0.27], [W, W * 0.73], [W / 2, W], [0, W * 0.73], [0, W * 0.27]].map(([x, y]) => [x + M, y + M])
    case 'control':
      return [[W / 2, 0], [W, W / 2], [W / 2, W], [0, W / 2]].map(([x, y]) => [x + M, y + M])
    case 'output':
      return [[0, 0], [W * 0.72, 0], [W, W / 2], [W * 0.72, W], [0, W]].map(([x, y]) => [x + M, y + M])
    default:
      return null
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

function cssRadius(shape: NodeShape): string {
  switch (shape) {
    case 'input': return '29px 10px 10px 29px'
    case 'transform': return '6px'
    case 'trigger': return '50%'
    default: return '0'
  }
}

function handlePositions(count: number): number[] {
  if (count <= 1) return [SIZE / 2]
  const step = SIZE / (count + 1)
  return Array.from({ length: count }, (_, i) => step * (i + 1))
}

// ── Bouton d'icône de la mini-toolbar ───────────────────────────────────────
function ToolBtn({ onClick, title, danger, children }: {
  onClick: (e: React.MouseEvent) => void; title: string; danger?: boolean; children: React.ReactNode
}) {
  return (
    <button
      className="nodrag flex h-5 w-5 items-center justify-center rounded transition-colors"
      style={{ color: danger ? '#ef4444' : 'var(--muted-foreground)' }}
      onClick={onClick}
      title={title}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.12)' : 'var(--muted)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

export const PipelineNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeStatuses    = useEditorStore((s) => s.nodeStatuses)
  const edges           = useEditorStore((s) => s.edges)
  const nodes           = useEditorStore((s) => s.nodes)
  const setNodes        = useEditorStore((s) => s.setNodes)
  const setEdges        = useEditorStore((s) => s.setEdges)
  const setSelectedNode = useEditorStore((s) => s.setSelectedNode)
  const setNodeStatus   = useEditorStore((s) => s.setNodeStatus)
  const inspectNodeData = useEditorStore((s) => s.inspectNodeData)
  const pipelineId      = useEditorStore((s) => s.pipeline?.id)
  const openNodeDrawer  = useUIStore((s) => s.openNodeDrawer)

  const d       = data as Record<string, unknown>
  const slug    = (d.type_slug as string) ?? ''
  const def     = NODE_REGISTRY_MAP[slug]
  const Icon    = (def && ICONS[def.icon]) ?? Box
  const label   = (d.label as string) ?? def?.label ?? slug
  const shape   = def?.shape ?? 'transform'
  const inputs  = def?.inputs ?? 1
  const outputs = def?.outputs ?? 1
  const disabled = Boolean(d.disabled)
  const hasPinned = Boolean(d.has_pinned_data)

  const status: NodeStatus = (nodeStatuses[id] as NodeStatus) ?? (d.status as NodeStatus) ?? 'idle'
  const execColor = EXEC[status]
  const dot = STATUS_DOT[status]

  const color = NODE_COLOR[slug] ?? '#94a3b8'
  // Nœud monochrome (gris) ; seule l'icône est colorée
  const borderColor = execColor ?? (selected ? 'var(--node-border-selected)' : 'var(--node-border)')
  const strokeW = execColor ? 1.5 : 1
  const poly = polyPoints(shape)
  const radius = shape === 'control' || shape === 'output' ? 4 : 6

  const hasOutgoing = edges.some((e) => e.source === id)
  const showAdd = outputs > 0 && def?.category !== 'Output' && def?.category !== 'Visualisation' && !hasOutgoing

  // ── UI states ──
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef<HTMLInputElement>(null)

  // Délai de masquage : évite que la toolbar disparaisse en traversant le gap nœud↔toolbar
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToolbarNow = () => { if (hideTimer.current) clearTimeout(hideTimer.current); setHovered(true) }
  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => { setHovered(false); setMenuOpen(false) }, 180)
  }

  useEffect(() => { if (renaming) inputRef.current?.focus() }, [renaming])

  const patchNode = (patch: Record<string, unknown>) =>
    setNodes(nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))

  // ── Actions ──
  const handleAdd = (e: React.MouseEvent) => { e.stopPropagation(); openNodeDrawer({ sourceNodeId: id }) }

  const doDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (pipelineId) { try { await nodesApi.deleteNode(pipelineId, id) } catch { /* demo */ } }
    setNodes(nodes.filter((n) => n.id !== id))
    setEdges(edges.filter((ed) => ed.source !== id && ed.target !== id))
    toast.success('Nœud supprimé')
  }

  const doToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    patchNode({ disabled: !disabled })
    toast.info(disabled ? 'Nœud activé' : 'Nœud désactivé')
  }

  const doOpen = (e: React.MouseEvent) => { e.stopPropagation(); setMenuOpen(false); setSelectedNode(id) }

  const doRunStep = (e: React.MouseEvent) => {
    e.stopPropagation(); setMenuOpen(false)
    setNodeStatus(id, 'running')
    setTimeout(() => setNodeStatus(id, 'success'), 900)
  }

  const doRename = (e: React.MouseEvent) => { e.stopPropagation(); setMenuOpen(false); setDraft(label); setRenaming(true) }

  const commitRename = () => {
    setRenaming(false)
    const v = draft.trim()
    if (v && v !== label) patchNode({ label: v })
  }

  const doCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); setMenuOpen(false)
    const src = nodes.find((n) => n.id === id)
    if (!src) return
    const position = { x: src.position.x + 40, y: src.position.y + 40 }
    const cfg = JSON.parse(JSON.stringify((src.data as Record<string, unknown>).config ?? {}))
    let newId = `local-${Date.now()}`
    if (pipelineId) {
      try {
        const created = await nodesApi.addNode(pipelineId, { type: slug, position, config: cfg as Record<string, unknown>, label: `${label} (copie)` })
        newId = created.id
      } catch { /* demo */ }
    }
    setNodes([...nodes, { id: newId, type: slug, position, data: { type_slug: slug, label: `${label} (copie)`, config: cfg } }])
    toast.success('Nœud copié')
  }

  // ── Raccourcis Données / Schéma (ouvrent l'inspecteur sur le bon onglet) ──
  const doViewData = (e: React.MouseEvent) => { e.stopPropagation(); setMenuOpen(false); inspectNodeData(id, 'test') }
  const doPinData = (e: React.MouseEvent) => { e.stopPropagation(); setMenuOpen(false); inspectNodeData(id, 'pin') }
  const doViewSchema = (e: React.MouseEvent) => { e.stopPropagation(); setMenuOpen(false); inspectNodeData(id, 'schema') }

  const doUnpin = async (e: React.MouseEvent) => {
    e.stopPropagation(); setMenuOpen(false)
    if (pipelineId) { try { await nodesApi.clearPinnedData(pipelineId, id) } catch { /* demo */ } }
    patchNode({ has_pinned_data: false })
    toast.success('Données désépinglées')
  }

  const doSync = async (e: React.MouseEvent) => {
    e.stopPropagation(); setMenuOpen(false)
    if (!pipelineId) return
    try {
      const fresh = await nodesApi.getNode(pipelineId, id)
      setNodes(nodes.map((n) => n.id === id ? { ...n, position: fresh.position, data: { ...n.data, ...fresh.data } } : n))
      toast.success('Nœud resynchronisé')
    } catch {
      toast.error('Synchronisation impossible')
    }
  }

  const menuItems = [
    { icon: Eye, label: 'Ouvrir', onClick: doOpen },
    { icon: Play, label: 'Exécuter l\'étape', onClick: doRunStep },
    { icon: Table2, label: 'Données de test', onClick: doViewData },
    { icon: Pin, label: 'Épingler des données', onClick: doPinData },
    ...(hasPinned ? [{ icon: PinOff, label: 'Désépingler', onClick: doUnpin }] : []),
    { icon: FileCode2, label: 'Voir le schéma', onClick: doViewSchema },
    { icon: RefreshCw, label: 'Resynchroniser', onClick: doSync },
    { icon: Pencil, label: 'Renommer', onClick: doRename },
    { icon: Copy, label: 'Copier', onClick: doCopy },
  ]

  const showToolbar = hovered || menuOpen

  return (
    <div
      style={{ position: 'relative', width: SIZE, height: SIZE, opacity: disabled ? 0.45 : 1 }}
      onMouseEnter={showToolbarNow}
      onMouseLeave={scheduleHide}
    >
      {/* ── Mini-toolbar au survol (au-dessus du nœud) ── */}
      {showToolbar && (
        <div
          className="nodrag"
          onMouseEnter={showToolbarNow}
          onMouseLeave={scheduleHide}
          style={{
            position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 1, padding: 2,
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 7,
            zIndex: 20, whiteSpace: 'nowrap',
          }}
        >
          {/* Pont invisible : comble le gap toolbar↔nœud pour garder le hover */}
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, height: 10 }} />

          <ToolBtn onClick={doDelete} title="Supprimer" danger><Trash2 size={12} /></ToolBtn>
          <ToolBtn onClick={doToggle} title={disabled ? 'Activer' : 'Désactiver'}><Power size={12} /></ToolBtn>
          <div style={{ width: 1, height: 13, background: 'var(--border)', margin: '0 1px' }} />
          <ToolBtn
            onClick={(e) => {
              e.stopPropagation()
              if (menuOpen) { setMenuOpen(false); return }
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
              // Menu placé au-dessus du bouton (donc au-dessus du nœud)
              setMenuPos({ top: r.top - 8, left: r.left + r.width / 2 })
              setMenuOpen(true)
            }}
            title="Plus d'actions"
          >
            <MoreHorizontal size={12} />
          </ToolBtn>
        </div>
      )}

      {/* Menu texte (trois points) — portal en fixed, toujours au-dessus des nœuds */}
      {menuOpen && menuPos && createPortal(
        <div
          className="nodrag"
          onMouseEnter={showToolbarNow}
          onMouseLeave={scheduleHide}
          style={{
            position: 'fixed',
            top: menuPos.top, left: menuPos.left,
            transform: 'translate(-50%, -100%)',
            minWidth: 172, padding: 4,
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            display: 'flex', flexDirection: 'column', gap: 1,
            zIndex: 9999,
          }}
        >
          {menuItems.map((it) => (
            <button
              key={it.label}
              onClick={it.onClick}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-left transition-colors"
              style={{ color: 'var(--foreground)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--muted)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <it.icon size={13} className="shrink-0" style={{ color: 'var(--muted-foreground)' }} />
              {it.label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Input handles — ramenés vers l'intérieur (trait au centre du cercle) */}
      {inputs > 0 && handlePositions(inputs).map((top, i) => (
        <Handle
          key={`in-${i}`}
          id={inputs > 1 ? `in-${i}` : undefined}
          type="target"
          position={Position.Left}
          style={{ top: `${top}px`, width: 9, height: 9, left: 0, zIndex: 5, background: 'var(--handle-bg)', border: '1.5px solid var(--handle-border)' }}
        />
      ))}

      {/* Forme + icône */}
      <div onClick={() => setSelectedNode(id)} style={{ position: 'relative', width: SIZE, height: SIZE, cursor: 'pointer' }}>
        {poly ? (
          <svg width={SIZE} height={SIZE} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <path d={roundedPath(poly, radius)} fill="var(--node-bg)" stroke={borderColor} strokeWidth={strokeW} strokeLinejoin="round" style={{ transition: 'stroke 0.25s ease' }} />
          </svg>
        ) : (
          <div style={{ position: 'absolute', inset: 0, borderRadius: cssRadius(shape), background: 'var(--node-bg)', border: `${strokeW}px solid ${borderColor}`, transition: 'border-color 0.25s ease' }} />
        )}

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={21} strokeWidth={1.7} color={color} />
        </div>

        {dot && (
          <span style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: dot.bg, border: '2px solid var(--canvas-bg)', animation: dot.pulse ? 'pulse-dot 1.4s ease-in-out infinite' : 'none' }} />
        )}
      </div>

      {/* Nom (ou champ de renommage) sous la forme */}
      <div style={{ position: 'absolute', top: SIZE + 3, left: '50%', transform: 'translateX(-50%)', width: 100, textAlign: 'center' }}>
        {renaming ? (
          <input
            ref={inputRef}
            className="nodrag"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false) }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', textAlign: 'center', fontSize: 10, fontWeight: 600,
              background: 'var(--card)', color: 'var(--foreground)',
              border: '1px solid var(--primary)', borderRadius: 4, padding: '1px 2px', outline: 'none',
            }}
          />
        ) : (
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--node-label)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </div>
        )}
      </div>

      {/* Output handles — ramenés vers l'intérieur */}
      {outputs > 0 && handlePositions(outputs).map((top, i) => (
        <Handle
          key={`out-${i}`}
          id={outputs > 1 ? `out-${i}` : undefined}
          type="source"
          position={Position.Right}
          style={{ top: `${top}px`, width: 9, height: 9, right: 0, zIndex: 5, background: 'var(--handle-bg)', border: '1.5px solid var(--handle-border)' }}
        />
      ))}

      {/* Stub "+" tant qu'il n'y a pas de connexion */}
      {showAdd && !showToolbar && (
        <div style={{ position: 'absolute', right: -30, top: SIZE / 2, transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 14, height: 1, background: 'var(--border)' }} />
          <button
            onClick={handleAdd}
            className="nodrag"
            style={{ pointerEvents: 'auto', width: 16, height: 16, borderRadius: 4, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            title="Ajouter un nœud connecté"
          >
            <Plus size={10} strokeWidth={2} color="var(--foreground)" />
          </button>
        </div>
      )}
    </div>
  )
})

PipelineNode.displayName = 'PipelineNode'
