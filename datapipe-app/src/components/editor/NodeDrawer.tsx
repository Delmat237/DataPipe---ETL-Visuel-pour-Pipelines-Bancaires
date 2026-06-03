'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useEditorStore } from '@/store/editor.store'
import { useUIStore } from '@/store/ui.store'
import { nodesApi } from '@/lib/api/nodes'
import { NODE_REGISTRY, CATEGORY_ORDER, type NodeDef } from '@/lib/nodeRegistry'
import { toast } from 'sonner'

interface NodeDrawerProps {
  pipelineId: string
}

export function NodeDrawer({ pipelineId }: NodeDrawerProps) {
  const [search, setSearch] = useState('')
  const { setNodes, nodes, setEdges, edges } = useEditorStore()
  const {
    nodeDrawerOpen, openNodeDrawer, closeNodeDrawer,
    pendingSourceNodeId, pendingEdgeId,
  } = useUIStore()

  const open = nodeDrawerOpen

  const filtered = useMemo(() => {
    if (!search) return NODE_REGISTRY
    const q = search.toLowerCase()
    return NODE_REGISTRY.filter(
      (t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    )
  }, [search])

  const grouped = useMemo(() => {
    const g: Record<string, NodeDef[]> = {}
    filtered.forEach((t) => {
      if (!g[t.category]) g[t.category] = []
      g[t.category].push(t)
    })
    return g
  }, [filtered])

  const addNode = async (type: NodeDef, position: { x: number; y: number }) => {
    try {
      const node = await nodesApi.addNode(pipelineId, {
        type: type.slug,
        position,
        config: {},
        label: type.label,
      })
      return { id: node.id, type: type.slug, position: node.position, data: { ...node.data, type_slug: type.slug } }
    } catch {
      // Demo / offline : nœud local
      return {
        id: `local-${Date.now()}`,
        type: type.slug,
        position,
        data: { label: type.label, config: {}, type_slug: type.slug },
      }
    }
  }

  const handlePick = async (type: NodeDef) => {
    // Position : à droite du nœud source si connexion en attente, sinon décalage
    let position = { x: 200 + Math.random() * 80, y: 150 + nodes.length * 30 }
    const sourceNode = pendingSourceNodeId ? nodes.find((n) => n.id === pendingSourceNodeId) : null
    if (sourceNode) {
      position = { x: sourceNode.position.x + 150, y: sourceNode.position.y }
    }

    const newNode = await addNode(type, position)
    setNodes([...nodes, newNode])

    // Auto-connexion depuis le nœud source
    if (sourceNode) {
      try {
        const edge = await nodesApi.createEdge(pipelineId, { source: sourceNode.id, target: newNode.id })
        setEdges([...edges, { id: edge.id, source: sourceNode.id, target: newNode.id }])
      } catch {
        setEdges([...edges, { id: `e-${Date.now()}`, source: sourceNode.id, target: newNode.id }])
      }
    }

    // Insertion sur une arête existante
    if (pendingEdgeId) {
      const edge = edges.find((e) => e.id === pendingEdgeId)
      if (edge) {
        const rest = edges.filter((e) => e.id !== pendingEdgeId)
        setEdges([
          ...rest,
          { id: `e-${Date.now()}-a`, source: edge.source, target: newNode.id },
          { id: `e-${Date.now()}-b`, source: newNode.id, target: edge.target },
        ])
      }
    }

    toast.success(`"${type.label}" ajouté`)
    closeNodeDrawer()
  }

  const handleDragStart = (e: React.DragEvent, type: NodeDef) => {
    e.dataTransfer.setData('application/reactflow-type', type.slug)
    e.dataTransfer.setData('application/reactflow-label', type.label)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <>
      {/* Bouton + — carré, en haut à droite du canvas */}
      <button
        onClick={() => (open ? closeNodeDrawer() : openNodeDrawer())}
        className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 hover:bg-white/10 active:scale-95"
        style={{
          background: open ? 'rgba(255,255,255,0.1)' : 'var(--border)',
          border: '1px solid var(--border)',
        }}
        title="Ajouter un nœud"
      >
        {open
          ? <X className="h-3.5 w-3.5 text-gray-400" />
          : <Plus className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />}
      </button>

      {/* Drawer — absolute, limité à la zone canvas, sans overlay ni blur */}
      <div
        className="absolute top-0 right-0 z-10 flex flex-col"
        style={{
          width: 264,
          height: '100%',
          background: 'var(--card)',
          borderLeft: '1px solid var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold text-foreground">
            {pendingSourceNodeId ? 'Connecter un nœud' : 'Ajouter un nœud'}
          </p>
          <button
            onClick={closeNodeDrawer}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-600 hover:bg-white/8 hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-600" />
            <Input
              className="h-7 pl-8 text-xs"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Node list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
            <div key={cat}>
              <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-widest text-gray-700">{cat}</p>
              {grouped[cat].map((type) => (
                <div
                  key={type.slug}
                  draggable
                  onDragStart={(e) => handleDragStart(e, type)}
                  onClick={() => handlePick(type)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors hover:bg-white/5"
                  title={type.description}
                >
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-600 group-hover:bg-primary transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-400 group-hover:text-foreground transition-colors truncate">
                      {type.label}
                    </p>
                    <p className="text-[10px] text-gray-700 truncate">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[9px] text-gray-700">Cliquer · Glisser pour placer</p>
        </div>
      </div>
    </>
  )
}
