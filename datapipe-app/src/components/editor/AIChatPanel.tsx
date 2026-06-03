'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, Loader2, Copy, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useEditorStore } from '@/store/editor.store'
import { aiApi } from '@/lib/api/ai'
import { nodesApi } from '@/lib/api/nodes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types'

interface AIChatPanelProps {
  pipelineId: string
}

export function AIChatPanel({ pipelineId }: AIChatPanelProps) {
  const { setAIChatOpen, pipeline, setNodes, setEdges } = useEditorStore()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant DataPipe. Je peux générer des pipelines, du SQL, ou répondre à vos questions sur vos données.',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = (await aiApi.chat(userMsg.content, sessionId)) as {
        message?: string | { content?: string }
        reply?: string
        response?: string
        answer?: string
        session_id?: string
      }
      if (res.session_id) setSessionId(res.session_id)
      const reply =
        (typeof res.message === 'object' ? res.message?.content : res.message) ??
        res.reply ??
        res.response ??
        res.answer ??
        '…'
      setMessages((prev) => [...prev, { role: 'assistant', content: String(reply) }])
    } catch {
      toast.error('Erreur de communication avec l\'IA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePipeline = async () => {
    if (!input.trim()) return
    const prompt = input.trim()
    setInput('')
    setIsLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: `Génère un pipeline : ${prompt}` }])

    try {
      const result = (await aiApi.generatePipeline(prompt)) as {
        pipeline?: { nodes?: Array<Record<string, unknown>>; edges?: Array<Record<string, unknown>> }
        nodes?: Array<Record<string, unknown>>
        edges?: Array<Record<string, unknown>>
        explanation?: string
        tokens_used?: number
      }
      const pipe = result.pipeline ?? result
      const rawNodes = pipe.nodes ?? []
      const rawEdges = pipe.edges ?? []

      // Build node IDs — cast via unknown to satisfy React Flow's Node type
      const localIds = rawNodes.map((n, i) => String(n.id ?? `ai_node_${i}`))
      let nodesWithIds = rawNodes.map((n, i) => ({
        id: localIds[i],
        type: String(n.type ?? 'default'),
        position: (n.position as { x: number; y: number }) ?? { x: 100 * i, y: 100 },
        data: { ...((n.data as Record<string, unknown>) ?? {}), type_slug: n.type },
      })) as unknown as import('@xyflow/react').Node[]
      let edgesWithIds = rawEdges.map((e, i) => ({
        id: String(e.id ?? `ai_edge_${i}`),
        source: String(e.source),
        target: String(e.target),
      }))

      // Persistance serveur en une requête (bulk) ; remappe les IDs locaux → serveur.
      if (pipelineId && rawNodes.length > 0) {
        try {
          const created = await nodesApi.addNodesBulk(
            pipelineId,
            rawNodes.map((n, i) => ({
              type: String(n.type ?? 'default'),
              label: (n.data as Record<string, unknown>)?.label as string | undefined,
              position: (n.position as { x: number; y: number }) ?? { x: 100 * i, y: 100 },
              config: ((n.data as Record<string, unknown>)?.config as Record<string, unknown>) ?? {},
            })),
          )
          if (created.length === localIds.length) {
            const idMap = new Map(localIds.map((old, i) => [old, created[i].id]))
            nodesWithIds = created.map((c) => ({
              id: c.id,
              type: c.type,
              position: c.position,
              data: { ...c.data, type_slug: c.data.type_slug },
            })) as unknown as import('@xyflow/react').Node[]
            edgesWithIds = edgesWithIds.map((e) => ({
              ...e,
              source: idMap.get(e.source) ?? e.source,
              target: idMap.get(e.target) ?? e.target,
            }))
          }
        } catch { /* demo / offline : on garde les nœuds locaux */ }
      }

      setNodes(nodesWithIds)
      setEdges(edgesWithIds)

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Pipeline généré ! ${result.explanation ?? ''}${result.tokens_used ? `\n\n_${result.tokens_used} tokens utilisés_` : ''}`,
        },
      ])
      toast.success('Pipeline injecté dans le canvas !')
    } catch {
      toast.error('Erreur lors de la génération')
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Désolé, je n\'ai pas pu générer le pipeline.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20">
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Assistant IA</p>
            <p className="text-[10px] text-gray-600">Propulsé par Claude</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setAIChatOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick actions */}
      <div className="flex gap-1.5 border-b border-border px-3 py-2">
        <button
          className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] text-gray-400 hover:border-purple-500/50 hover:text-purple-400 transition-colors"
          onClick={() => setInput('Génère un pipeline pour ')}
        >
          <Zap className="h-2.5 w-2.5" /> Générer pipeline
        </button>
        <button
          className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] text-gray-400 hover:border-purple-500/50 hover:text-purple-400 transition-colors"
          onClick={() => setInput('Génère du SQL pour ')}
        >
          <Zap className="h-2.5 w-2.5" /> Générer SQL
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary/20 text-foreground'
                    : 'bg-card text-foreground'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card rounded-xl px-3 py-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3 space-y-2">
        <Textarea
          className="min-h-[60px] resize-none text-xs"
          placeholder="Posez votre question ou décrivez le pipeline à créer…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-purple-400 hover:text-purple-300 gap-1.5"
            onClick={handleGeneratePipeline}
            disabled={!input.trim() || isLoading}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Générer pipeline
          </Button>
          <Button size="sm" onClick={handleSend} disabled={!input.trim() || isLoading}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
