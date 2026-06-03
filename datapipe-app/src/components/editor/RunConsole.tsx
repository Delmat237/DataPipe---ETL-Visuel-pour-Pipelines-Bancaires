'use client'

import { useEffect, useRef } from 'react'
import { ChevronDown, Terminal, Table2, Box, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useEditorStore } from '@/store/editor.store'
import { cn, formatDuration, formatNumber } from '@/lib/utils'

interface RunConsoleProps {
  height: number
  onClose: () => void
  onResize: (delta: number) => void
}

const LOG_COLORS: Record<string, string> = {
  INFO: 'text-gray-400',
  WARNING: 'text-amber-400',
  ERROR: 'text-red-400',
}

export function RunConsole({ height, onClose }: RunConsoleProps) {
  const { logs, consoleTab, setConsoleTab, activeRunId, runStatus, selectedNodeId } = useEditorStore()
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div
      className="flex flex-col border-t border-border bg-background"
      style={{ height }}
    >
      {/* Console header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
        <div className="flex items-center gap-3">
          <Tabs value={consoleTab} onValueChange={(v) => setConsoleTab(v as typeof consoleTab)}>
            <TabsList className="h-7 gap-0.5">
              <TabsTrigger value="logs" className="h-6 gap-1.5 px-2.5 text-xs">
                <Terminal className="h-3 w-3" />
                Logs
                {logs.filter((l) => l.level === 'ERROR').length > 0 && (
                  <Badge variant="destructive" className="h-3.5 min-w-3.5 px-1 text-[9px]">
                    {logs.filter((l) => l.level === 'ERROR').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="data" className="h-6 gap-1.5 px-2.5 text-xs">
                <Table2 className="h-3 w-3" />
                Données
              </TabsTrigger>
              <TabsTrigger value="schema" className="h-6 gap-1.5 px-2.5 text-xs">
                <Box className="h-3 w-3" />
                Schéma
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeRunId && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <span className={cn(
                'h-1.5 w-1.5 rounded-full',
                runStatus === 'running' ? 'bg-blue-400 animate-pulse' :
                runStatus === 'success' ? 'bg-emerald-400' :
                runStatus === 'failed' ? 'bg-red-400' : 'bg-gray-600'
              )} />
              Run #{activeRunId.slice(-6)}
              {runStatus && <span className="capitalize">· {runStatus}</span>}
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {consoleTab === 'logs' && (
          <div className="p-3 font-mono text-xs space-y-0.5">
            {logs.length === 0 && (
              <p className="text-gray-700 py-4 text-center">
                {activeRunId ? 'En attente des logs…' : 'Lancez un run pour voir les logs'}
              </p>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 py-0.5 border-b border-[#111111]">
                <span className="text-gray-700 shrink-0">{log.ts}</span>
                <span className={cn('shrink-0 w-14', LOG_COLORS[log.level] ?? 'text-gray-500')}>
                  {log.level}
                </span>
                {log.node_id && (
                  <span className="text-gray-600 shrink-0 truncate max-w-[80px]">{log.node_id}</span>
                )}
                <span className="text-foreground break-all">{log.msg}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}

        {consoleTab === 'data' && (
          <div className="p-4 text-xs text-gray-600">
            {selectedNodeId
              ? <DataPreview pipelineId="" nodeId={selectedNodeId} />
              : <p className="py-4 text-center">Cliquez sur un nœud pour voir ses données</p>
            }
          </div>
        )}

        {consoleTab === 'schema' && (
          <div className="p-4 text-xs text-gray-600 text-center py-4">
            Sélectionnez un nœud exécuté pour voir son schéma
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// Inline DataPreview — loads preview for selected node's last run
function DataPreview({ nodeId }: { pipelineId: string; nodeId: string }) {
  const activeRunId = useEditorStore((s) => s.activeRunId)
  if (!activeRunId) {
    return <p className="text-center py-4">Aucun run actif</p>
  }
  // In real use, call runService.getNodePreview and display table
  return (
    <p className="text-center text-gray-600">
      Données du nœud {nodeId} — Run #{activeRunId.slice(-6)}
    </p>
  )
}
