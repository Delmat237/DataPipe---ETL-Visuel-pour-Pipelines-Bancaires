'use client'

import {
  BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps,
} from '@xyflow/react'
import { Trash2, Plus } from 'lucide-react'
import { useEditorStore } from '@/store/editor.store'
import { useUIStore } from '@/store/ui.store'
import { nodesApi } from '@/lib/api/nodes'

interface PipelineEdgeData {
  pipelineId?: string
  hovered?: boolean
  onKeep?: (id: string) => void
  onRelease?: () => void
}

export function PipelineEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, markerEnd, data,
}: EdgeProps) {
  const { edges, setEdges } = useEditorStore()
  const openNodeDrawer = useUIStore((s) => s.openNodeDrawer)

  const d = (data ?? {}) as PipelineEdgeData
  const pipelineId = d.pipelineId
  const hovered = Boolean(d.hovered)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  })

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (pipelineId) { try { await nodesApi.deleteEdge(pipelineId, id) } catch { /* demo */ } }
    setEdges(edges.filter((edge) => edge.id !== id))
  }

  const handleInsert = (e: React.MouseEvent) => {
    e.stopPropagation()
    openNodeDrawer({ edgeId: id })
  }

  return (
    <>
      {/* interactionWidth = zone de hit gérée nativement par React Flow (déclenche onEdgeMouseEnter) */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={22}
        style={{
          stroke: hovered ? 'var(--primary)' : 'var(--edge)',
          strokeWidth: hovered ? 1.6 : 1.2,
          transition: 'stroke 0.15s',
        }}
      />

      {hovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              display: 'flex',
              gap: 5,
              zIndex: 1000,
            }}
            className="nodrag nopan"
            onMouseEnter={() => d.onKeep?.(id)}
            onMouseLeave={() => d.onRelease?.()}
          >
            {/* Insérer un nœud au milieu */}
            <button
              onClick={handleInsert}
              className="flex items-center justify-center rounded-md transition-all hover:scale-110 active:scale-95"
              style={{ width: 18, height: 18, background: 'var(--card)', border: '1px solid var(--border)' }}
              title="Insérer un nœud ici"
            >
              <Plus style={{ width: 11, height: 11 }} className="text-foreground" strokeWidth={2} />
            </button>

            {/* Supprimer */}
            <button
              onClick={handleDelete}
              className="flex items-center justify-center rounded-md transition-all hover:scale-110 active:scale-95"
              style={{ width: 18, height: 18, background: 'var(--card)', border: '1px solid var(--border)' }}
              title="Supprimer la connexion"
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)' }}
            >
              <Trash2 style={{ width: 11, height: 11 }} className="text-red-400" strokeWidth={1.8} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
