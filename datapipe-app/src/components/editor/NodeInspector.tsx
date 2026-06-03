'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, Save, RefreshCw, Replace } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useEditorStore } from '@/store/editor.store'
import { nodesApi } from '@/lib/api/nodes'
import { toast } from 'sonner'
import { NODE_REGISTRY_MAP } from '@/lib/nodeRegistry'
import { cn } from '@/lib/utils'
import { FieldRenderer } from './FieldRenderer'
import { NodeDataPanel } from './NodeDataPanel'

interface NodeInspectorProps {
  pipelineId: string
}

export function NodeInspector({ pipelineId }: NodeInspectorProps) {
  const { selectedNodeId, nodes, setSelectedNode, setNodes, edges, setEdges } = useEditorStore()
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [label, setLabel] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const typeSlug = selectedNode
    ? ((selectedNode.data as Record<string, unknown>).type_slug as string ?? selectedNode.type)
    : null
  const def = typeSlug ? NODE_REGISTRY_MAP[typeSlug] : null

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedNode) return
    const d = selectedNode.data as Record<string, unknown>
    setConfig((d.config as Record<string, unknown>) ?? {})
    setLabel((d.label as string) ?? def?.label ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!selectedNode || !typeSlug || !def) return null

  const setField = (key: string, value: unknown) => {
    setConfig((prev) => {
      const next = { ...prev }
      if (value === undefined) delete next[key]
      else next[key] = value
      return next
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await nodesApi.updateNode(pipelineId, selectedNode.id, { config, label })
      setNodes(nodes.map((n) =>
        n.id === selectedNode.id ? { ...n, data: { ...n.data, config, label } } : n
      ))
      toast.success('Nœud mis à jour')
    } catch {
      // Demo / offline : maj locale
      setNodes(nodes.map((n) =>
        n.id === selectedNode.id ? { ...n, data: { ...n.data, config, label } } : n
      ))
      toast.success('Nœud mis à jour')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefresh = async () => {
    setIsSyncing(true)
    try {
      const fresh = await nodesApi.getNode(pipelineId, selectedNode.id)
      setConfig(fresh.data.config ?? {})
      setLabel(fresh.data.label ?? def?.label ?? '')
      setNodes(nodes.map((n) =>
        n.id === selectedNode.id
          ? { ...n, position: fresh.position, data: { ...n.data, ...fresh.data } }
          : n
      ))
      toast.success('Nœud synchronisé')
    } catch {
      toast.error('Synchronisation impossible')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleReplace = async () => {
    setIsReplacing(true)
    try {
      await nodesApi.replaceNode(pipelineId, selectedNode.id, {
        type: typeSlug,
        label,
        position: selectedNode.position,
        config,
      })
      setNodes(nodes.map((n) =>
        n.id === selectedNode.id ? { ...n, data: { ...n.data, config, label } } : n
      ))
      toast.success('Nœud remplacé')
    } catch {
      toast.error('Remplacement impossible')
    } finally {
      setIsReplacing(false)
    }
  }

  const handleDelete = async () => {
    try {
      await nodesApi.deleteNode(pipelineId, selectedNode.id)
    } catch { /* demo */ }
    setNodes(nodes.filter((n) => n.id !== selectedNode.id))
    setEdges(edges.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
    setSelectedNode(null)
    toast.success('Nœud supprimé')
  }

  return (
    <aside className="flex h-full w-[300px] flex-col border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{def.label}</p>
          <p className="text-[10px] text-gray-600">{def.category}</p>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={handleRefresh} disabled={isSyncing} title="Resynchroniser depuis le serveur">
            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setSelectedNode(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Description */}
          <p className="text-[11px] text-gray-600 leading-relaxed">{def.description}</p>

          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-gray-400">Label affiché</Label>
            <Input className="h-8 text-xs" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={def.label} />
          </div>

          {def.fields.length > 0 && <Separator />}

          {/* Config fields (schema-driven) */}
          {def.fields.length > 0 ? (
            <div className="space-y-4">
              <Label className="text-[10px] uppercase tracking-widest text-gray-700">Configuration</Label>
              {def.fields.map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={config[field.key]}
                  onChange={(v) => setField(field.key, v)}
                />
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-gray-600 italic">Ce nœud n&apos;a pas de configuration.</p>
          )}

          <Separator />

          {/* Données de test, épinglage & schéma */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-gray-700">Données & schéma</Label>
            <NodeDataPanel
              pipelineId={pipelineId}
              nodeId={selectedNode.id}
              typeSlug={typeSlug}
              hasPinnedData={Boolean((selectedNode.data as Record<string, unknown>).has_pinned_data)}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-3 flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={isSaving} className="flex-1 gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={handleReplace} disabled={isReplacing} title="Remplacer le nœud (écrase tout)">
          <Replace className={cn('h-4 w-4', isReplacing && 'animate-pulse')} />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={handleDelete} className="text-red-400 hover:text-red-300">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  )
}
