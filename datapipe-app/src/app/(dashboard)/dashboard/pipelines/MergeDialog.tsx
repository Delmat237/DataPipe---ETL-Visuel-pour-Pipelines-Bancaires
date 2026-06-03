'use client'

import { useState } from 'react'
import { GitMerge, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { pipelinesApi } from '@/lib/api/pipelines'
import { toast } from 'sonner'
import type { Pipeline } from '@/types'

export function MergeDialog({
  open,
  pipelines,
  onClose,
  onMerged,
}: {
  open: boolean
  pipelines: Pipeline[]
  onClose: () => void
  onMerged: () => void
}) {
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [busy, setBusy] = useState(false)

  const handleMerge = async () => {
    if (!sourceId || !targetId || sourceId === targetId) {
      toast.error('Choisissez deux pipelines différents')
      return
    }
    setBusy(true)
    try {
      await pipelinesApi.merge({ source_id: sourceId, target_id: targetId })
      toast.success('Pipelines fusionnés')
      onMerged()
      onClose()
    } catch { toast.error('Fusion impossible') } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GitMerge className="h-4 w-4" /> Fusionner deux pipelines</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500">Les nœuds du pipeline source sont copiés dans le pipeline cible.</p>
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 space-y-1.5">
            <Label>Source</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue placeholder="Pipeline source" /></SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-600 mt-5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Label>Cible</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger><SelectValue placeholder="Pipeline cible" /></SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleMerge} disabled={busy || !sourceId || !targetId}>
            {busy ? 'Fusion…' : 'Fusionner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
