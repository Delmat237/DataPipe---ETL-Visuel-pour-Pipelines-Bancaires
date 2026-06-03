'use client'

import { Sparkles, Terminal, History, Clock, type LucideIcon } from 'lucide-react'
import { useEditorStore } from '@/store/editor.store'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

function SideBtn({ icon: Icon, label, active, onClick }: {
  icon: LucideIcon; label: string; active?: boolean; onClick?: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 active:scale-95"
          style={{
            background: active ? 'var(--accent)' : 'var(--card)',
            border: '1px solid var(--border)',
            color: active ? 'var(--primary)' : 'var(--muted-foreground)',
          }}
          onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--muted)' }}
          onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'var(--card)' }}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  )
}

// Barre verticale en haut à droite du canvas, juste sous le bouton + (NodeDrawer)
export function CanvasSideToolbar() {
  const { isAIChatOpen, setAIChatOpen, isConsoleOpen, setConsoleOpen } = useEditorStore()

  return (
    <div className="absolute top-[52px] right-3 z-20 flex flex-col gap-1.5">
      <SideBtn icon={Sparkles} label="Assistant IA" active={isAIChatOpen} onClick={() => setAIChatOpen(!isAIChatOpen)} />
      <SideBtn icon={Terminal} label="Console / Logs" active={isConsoleOpen} onClick={() => setConsoleOpen(!isConsoleOpen)} />
      <SideBtn icon={History} label="Historique des versions" />
      <SideBtn icon={Clock} label="Planifications" />
    </div>
  )
}
