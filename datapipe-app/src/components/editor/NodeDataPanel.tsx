'use client'

import { useState } from 'react'
import { Pin, PinOff, Play, FileCode2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { nodesApi } from '@/lib/api/nodes'
import { useEditorStore } from '@/store/editor.store'
import { toast } from 'sonner'

interface NodeDataPanelProps {
  pipelineId: string
  nodeId: string
  typeSlug: string
  hasPinnedData?: boolean
}

function Json({ value }: { value: unknown }) {
  if (value == null) return <p className="text-[11px] text-gray-600 italic py-2">Aucune donnée chargée.</p>
  return (
    <pre className="max-h-56 overflow-auto rounded-md border border-border bg-background p-2 text-[10px] leading-relaxed text-gray-300 font-mono whitespace-pre-wrap">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

export function NodeDataPanel({ pipelineId, nodeId, typeSlug, hasPinnedData }: NodeDataPanelProps) {
  const { nodes, setNodes, nodeDataTab, setNodeDataTab } = useEditorStore()
  const [busy, setBusy] = useState<string | null>(null)
  const [testData, setTestData] = useState<unknown>(null)
  const [pinned, setPinned] = useState<unknown>(null)
  const [pinText, setPinText] = useState('[\n  { "id": 1, "value": "exemple" }\n]')
  const [schema, setSchema] = useState<unknown>(null)

  const markPinned = (flag: boolean) => {
    setNodes(nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, has_pinned_data: flag } } : n)))
  }

  const loadTestData = async () => {
    setBusy('test')
    try { setTestData(await nodesApi.getTestData(pipelineId, nodeId)) }
    catch { toast.error('Données de test indisponibles') }
    finally { setBusy(null) }
  }

  const loadPinned = async () => {
    setBusy('pin-get')
    try { setPinned(await nodesApi.getPinnedData(pipelineId, nodeId)) }
    catch { toast.error('Aucune donnée épinglée') }
    finally { setBusy(null) }
  }

  const handlePin = async () => {
    let parsed: unknown[]
    try {
      const p = JSON.parse(pinText)
      parsed = Array.isArray(p) ? p : [p]
    } catch { toast.error('JSON invalide'); return }
    setBusy('pin-set')
    try {
      await nodesApi.pinData(pipelineId, nodeId, parsed)
      markPinned(true)
      toast.success('Données épinglées')
      setPinned(parsed)
    } catch { toast.error('Épinglage impossible') }
    finally { setBusy(null) }
  }

  const handleUnpin = async () => {
    setBusy('pin-clear')
    try {
      await nodesApi.clearPinnedData(pipelineId, nodeId)
      markPinned(false)
      setPinned(null)
      toast.success('Données désépinglées')
    } catch { toast.error('Erreur') }
    finally { setBusy(null) }
  }

  const loadSchema = async () => {
    setBusy('schema')
    try {
      const [type, sch] = await Promise.all([
        nodesApi.getNodeType(typeSlug).catch(() => null),
        nodesApi.getNodeTypeSchema(typeSlug).catch(() => null),
      ])
      setSchema({ type, schema: sch })
    } catch { toast.error('Schéma indisponible') }
    finally { setBusy(null) }
  }

  return (
    <Tabs value={nodeDataTab} onValueChange={(v) => setNodeDataTab(v as typeof nodeDataTab)} className="w-full">
      <TabsList className="h-7 w-full justify-start gap-0.5">
        <TabsTrigger value="test" className="h-6 px-2 text-[11px]">Test</TabsTrigger>
        <TabsTrigger value="pin" className="h-6 px-2 text-[11px]">
          Épingler
          {hasPinnedData && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
        </TabsTrigger>
        <TabsTrigger value="schema" className="h-6 px-2 text-[11px]">Schéma</TabsTrigger>
      </TabsList>

      <TabsContent value="test" className="space-y-2 pt-2">
        <Button size="sm" variant="outline" className="h-7 w-full gap-1.5 text-xs" onClick={loadTestData} disabled={busy === 'test'}>
          {busy === 'test' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Charger les données de test
        </Button>
        <Json value={testData} />
      </TabsContent>

      <TabsContent value="pin" className="space-y-2 pt-2">
        <Label className="text-[11px] text-gray-400">Données à épingler (JSON)</Label>
        <Textarea className="font-mono text-[10px] h-24" value={pinText} onChange={(e) => setPinText(e.target.value)} />
        <div className="flex gap-1.5">
          <Button size="sm" className="h-7 flex-1 gap-1.5 text-xs" onClick={handlePin} disabled={busy === 'pin-set'}>
            <Pin className="h-3.5 w-3.5" /> Épingler
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={loadPinned} disabled={busy === 'pin-get'}>
            Voir
          </Button>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs text-red-400 hover:text-red-300" onClick={handleUnpin} disabled={busy === 'pin-clear'}>
            <PinOff className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Json value={pinned} />
      </TabsContent>

      <TabsContent value="schema" className="space-y-2 pt-2">
        <Button size="sm" variant="outline" className="h-7 w-full gap-1.5 text-xs" onClick={loadSchema} disabled={busy === 'schema'}>
          {busy === 'schema' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCode2 className="h-3.5 w-3.5" />}
          Charger le schéma du type
        </Button>
        <Json value={schema} />
      </TabsContent>
    </Tabs>
  )
}
