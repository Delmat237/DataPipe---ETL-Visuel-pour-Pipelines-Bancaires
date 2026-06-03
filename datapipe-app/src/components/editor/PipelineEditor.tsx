'use client'

import { useEffect, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useEditorStore } from '@/store/editor.store'
import { pipelinesApi } from '@/lib/api/pipelines'
import { NODE_REGISTRY } from '@/lib/nodeRegistry'
import { DEMO_PIPELINES_DATA } from '@/lib/demoPipelines'
import { EditorTopBar } from './EditorTopBar'
import { NodeDrawer } from './NodeDrawer'
import { EditorCanvas } from './EditorCanvas'
import { NodeInspector } from './NodeInspector'
import { RunConsole } from './RunConsole'
import { ConsoleBar } from './ConsoleBar'
import { CanvasSideToolbar } from './CanvasSideToolbar'
import { AIChatPanel } from './AIChatPanel'
import { Skeleton } from '@/components/ui/skeleton'

interface PipelineEditorProps {
  pipelineId: string
}

export function PipelineEditor({ pipelineId }: PipelineEditorProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [consoleHeight, setConsoleHeight] = useState(220)

  const {
    setPipeline, setNodeTypes,
    isInspectorOpen, isConsoleOpen, setConsoleOpen, isAIChatOpen,
  } = useEditorStore()

  useEffect(() => {
    // Le registry local pilote les nœuds (formes, schémas) — source de vérité
    setNodeTypes(NODE_REGISTRY)

    const load = async () => {
      try {
        // Demo pipelines: load mock data without API
        if (pipelineId.startsWith('demo-')) {
          const mock = DEMO_PIPELINES_DATA[pipelineId]
          if (mock) {
            setPipeline(mock.pipeline)
            useEditorStore.getState().setNodes(mock.nodes)
            useEditorStore.getState().setEdges(mock.edges)
          }
          setIsLoading(false)
          return
        }
        const pipeline = await pipelinesApi.get(pipelineId)
        setPipeline(pipeline)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // Reset run state on mount
    useEditorStore.getState().resetRun()
    return () => {
      useEditorStore.getState().resetRun()
    }
  }, [pipelineId, setPipeline, setNodeTypes])

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col bg-background">
        <div className="h-12 border-b border-border bg-background" />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-8 space-y-4">
            <Skeleton className="h-32 w-48 rounded-xl" />
            <Skeleton className="h-32 w-48 rounded-xl ml-64" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-full w-full flex-col overflow-hidden bg-background">
        {/* Top bar */}
        <EditorTopBar pipelineId={pipelineId} />

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Center + bottom */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Canvas — relative pour que NodeDrawer / toolbar soient contenus dedans */}
            <div className="relative flex-1 overflow-hidden">
              <EditorCanvas pipelineId={pipelineId} />
              <NodeDrawer pipelineId={pipelineId} />
              <CanvasSideToolbar />
            </div>

            {/* Console (au-dessus de la barre) */}
            {isConsoleOpen && (
              <RunConsole
                height={consoleHeight}
                onClose={() => setConsoleOpen(false)}
                onResize={(delta) => setConsoleHeight((h) => Math.max(120, Math.min(500, h + delta)))}
              />
            )}

            {/* Barre Logs rétractable — toujours visible */}
            <ConsoleBar />
          </div>

          {/* Right: inspector */}
          {isInspectorOpen && (
            <NodeInspector pipelineId={pipelineId} />
          )}

          {/* Right: chat IA — collé à droite, pousse le canvas (comme l'inspecteur) */}
          {isAIChatOpen && <AIChatPanel pipelineId={pipelineId} />}
        </div>
      </div>
    </ReactFlowProvider>
  )
}
