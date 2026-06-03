'use client'

import { useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store/theme.store'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  /** Compact = icône seule (sidebar repliée) */
  compact?: boolean
  className?: string
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { theme, toggleTheme, hydrate } = useThemeStore()

  // Synchronise le store avec la valeur déjà appliquée par le script no-flash
  useEffect(() => { hydrate() }, [hydrate])

  const isDark = theme === 'dark'

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        title={isDark ? 'Passer en clair' : 'Passer en sombre'}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          className
        )}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className
      )}
    >
      {isDark ? <Moon className="h-4 w-4 shrink-0" /> : <Sun className="h-4 w-4 shrink-0" />}
      <span className="flex-1 text-left">{isDark ? 'Thème sombre' : 'Thème clair'}</span>
    </button>
  )
}
