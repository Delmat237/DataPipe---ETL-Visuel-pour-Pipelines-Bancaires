'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow, Background, MiniMap, Panel, BackgroundVariant, MarkerType,
  type OnConnect, type NodeTypes, type EdgeTypes, addEdge,
  type Node as RFNode,
} from '@xyflow/react'
import { CanvasControls } from './CanvasControls'
import '@xyflow/react/dist/style.css'
import { useEditorStore } from '@/store/editor.store'
import { useUIStore } from '@/store/ui.store'
import { nodesApi } from '@/lib/api/nodes'
import { NODE_REGISTRY } from '@/lib/nodeRegistry'
import { toast } from 'sonner'
import { PipelineNode } from '@/components/nodes/PipelineNode'
import { PipelineEdge } from './PipelineEdge'

// Tous les types de nœuds utilisent le même composant générique piloté par le registry
const nodeTypes: NodeTypes = Object.fromEntries(
  NODE_REGISTRY.map((n) => [n.slug, PipelineNode])
)
nodeTypes.default = PipelineNode

const edgeTypes: EdgeTypes = { pipeline: PipelineEdge }

interface EditorCanvasProps {
  pipelineId: string
}

export function EditorCanvas({ pipelineId }: EditorCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges, setNodeTypes } = useEditorStore()
  const canvasLocked = useUIStore((s) => s.canvasLocked)

  // Survol d'arête géré nativement par React Flow (fiable) + délai pour atteindre les boutons
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enterEdge = useCallback((edgeId: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setHoveredEdge(edgeId)
  }, [])
  const leaveEdge = useCallback(() => {
    hideTimer.current = setTimeout(() => setHoveredEdge(null), 160)
  }, [])

  // Seed le store avec le registry (source de vérité des nœuds)
  useEffect(() => {
    setNodeTypes(NODE_REGISTRY)
  }, [setNodeTypes])

  // Injecte le type custom + flèche + pipelineId + état de survol sur chaque arête
  const displayEdges = useMemo(
    () => edges.map((e) => ({
      ...e,
      type: 'pipeline',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 22, height: 22, strokeWidth: 0 },
      data: { ...e.data, pipelineId, hovered: e.id === hoveredEdge, onKeep: enterEdge, onRelease: leaveEdge },
    })),
    [edges, pipelineId, hoveredEdge, enterEdge, leaveEdge]
  )

  const onConnect: OnConnect = useCallback(
    async (connection) => {
      if (!connection.source || !connection.target) return
      // Le backend ne valide pas une arête isolée : garde-fou minimal côté client.
      if (connection.source === connection.target) {
        toast.error('Un nœud ne peut pas se connecter à lui-même')
        return
      }
      try {
        const edge = await nodesApi.createEdge(pipelineId, {
          source: connection.source,
          target: connection.target,
          source_handle: connection.sourceHandle ?? undefined,
          target_handle: connection.targetHandle ?? undefined,
        })
        setEdges(addEdge({ ...connection, id: edge.id }, edges))
      } catch {
        toast.error('Erreur lors de la connexion')
      }
    },
    [pipelineId, edges, setEdges]
  )

  const onNodeDragStop = useCallback(
    async (_event: unknown, node: RFNode) => {
      try {
        await nodesApi.updateNode(pipelineId, node.id, { position: node.position })
      } catch {}
    },
    [pipelineId]
  )

  // Drop from node panel
  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const typeSlug = e.dataTransfer.getData('application/reactflow-type')
      const labelText = e.dataTransfer.getData('application/reactflow-label')
      if (!typeSlug) return

      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const position = { x: e.clientX - bounds.left - 90, y: e.clientY - bounds.top - 20 }

      try {
        const { setNodes, nodes: currentNodes } = useEditorStore.getState()
        const node = await nodesApi.addNode(pipelineId, {
          type: typeSlug,
          position,
          config: {},
          label: labelText,
        })
        setNodes([
          ...currentNodes,
          {
            id: node.id,
            type: typeSlug,
            position: node.position,
            data: { ...node.data, type_slug: typeSlug },
          },
        ])
        toast.success(`"${labelText}" ajouté`)
      } catch {
        toast.error("Erreur lors de l'ajout")
      }
    },
    [pipelineId]
  )

  return (
    <div
      className="h-full w-full"
      style={{ background: 'var(--canvas-bg)' }}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <ReactFlow
        nodes={nodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgeMouseEnter={(_, edge) => enterEdge(edge.id)}
        onEdgeMouseLeave={leaveEdge}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={!canvasLocked}
        nodesConnectable={!canvasLocked}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultEdgeOptions={{
          type: 'pipeline',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 22, height: 22, strokeWidth: 0 },
          style: { stroke: '#4a4a52', strokeWidth: 2 },
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
        // Empêche le scroll de la page quand la souris est sur le canvas
        preventScrolling
        panOnScroll={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="var(--canvas-dot)" />
        <MiniMap className="border-border! bg-card!" nodeColor="var(--node-border)" maskColor="rgba(0,0,0,0.4)" />
        {/* Barre de contrôles custom — Panel React Flow pour rester dans le canvas */}
        <Panel position="bottom-center" style={{ margin: 0, width: '100%', pointerEvents: 'none' }}>
          <CanvasControls pipelineId={pipelineId} />
        </Panel>
      </ReactFlow>
    </div>
  )
}
