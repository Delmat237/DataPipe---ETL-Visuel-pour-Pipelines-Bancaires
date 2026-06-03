'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Play, Square, RotateCcw, Save, ChevronLeft, Zap,
  Clock, History, Sparkles, Terminal, CheckCircle2, XCircle, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEditorStore } from '@/store/editor.store'
import { pipelinesApi } from '@/lib/api/pipelines'
import { runsApi } from '@/lib/api/runs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EditorTopBarProps {
  pipelineId: string
}

export function EditorTopBar({ pipelineId }: EditorTopBarProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const {
    pipeline, nodes, edges, isDirty, isRunning, runStatus,
    activeRunId, setActiveRun, setRunStatus, setNodeStatus, appendLog,
    resetRun, isConsoleOpen, setConsoleOpen, setAIChatOpen,
  } = useEditorStore()

  const handleSave = async () => {
    if (!pipeline) return
    setIsSaving(true)
    try {
      // Les nœuds et arêtes sont déjà persistés à chaque opération (ajout, drag,
      // édition). Ici on persiste les métadonnées du pipeline.
      await pipelinesApi.save(pipelineId, { name: pipeline.name })
      useEditorStore.getState().markClean()
      toast.success('Pipeline sauvegardé')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRun = async () => {
    try {
      // Save first
      if (isDirty) await handleSave()
      const run = await runsApi.run(pipelineId)
      setActiveRun(run.id)
      setRunStatus('running')
      setConsoleOpen(true)

      // Stream SSE des logs ; statut final récupéré à la fin du flux.
      runsApi.streamLogs(
        run.id,
        (log) => appendLog(log),
        async () => {
          try {
            const final = await runsApi.get(pipelineId, run.id)
            setRunStatus(final.status)
            toast[final.status === 'success' ? 'success' : 'error'](
              final.status === 'success' ? 'Run terminé avec succès' : 'Run terminé avec erreurs',
            )
          } catch { /* ignore */ }
        },
      )
    } catch {
      toast.error('Erreur lors du lancement')
    }
  }

  const handleCancel = async () => {
    if (!activeRunId) return
    try {
      await runsApi.cancel(pipelineId, activeRunId)
      setRunStatus('cancelled')
      resetRun()
      toast.info('Run annulé')
    } catch {
      toast.error('Impossible d\'annuler')
    }
  }

  const statusIcon = runStatus === 'running' || runStatus === 'queued'
    ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
    : runStatus === 'success'
    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    : runStatus === 'failed'
    ? <XCircle className="h-3.5 w-3.5 text-red-400" />
    : null

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      {/* Left */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15">
          <Zap className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">{pipeline?.name}</span>
        {isDirty && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Modifications non sauvegardées" />
        )}
      </div>

      {/* Right — les icônes outils sont passées dans la barre verticale du canvas */}
      <div className="flex items-center gap-1.5">
        {statusIcon && (
          <div className="flex items-center gap-1.5 mr-1 text-xs text-gray-500">
            {statusIcon}
            <span className="capitalize">{runStatus}</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  )
}
