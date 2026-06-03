'use client'

import { Terminal, ChevronUp, ChevronDown } from 'lucide-react'
import { useEditorStore } from '@/store/editor.store'

// Barre toujours visible en bas : signale qu'on peut ouvrir les logs ici.
export function ConsoleBar() {
  const { isConsoleOpen, setConsoleOpen, logs, runStatus } = useEditorStore()
  const count = logs?.length ?? 0

  return (
    <div
      className="flex h-8 shrink-0 items-center justify-between px-4 cursor-pointer select-none"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}
      onClick={() => setConsoleOpen(!isConsoleOpen)}
    >
      <div className="flex items-center gap-2">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Logs</span>
        {count > 0 && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{count}</span>
        )}
        {(runStatus === 'running' || runStatus === 'queued') && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary" style={{ animation: 'pulse-dot 1.4s infinite' }} />
        )}
      </div>

      <button
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title={isConsoleOpen ? 'Fermer les logs' : 'Ouvrir les logs'}
      >
        {isConsoleOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>
    </div>
  )
}
