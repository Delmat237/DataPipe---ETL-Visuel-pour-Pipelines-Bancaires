'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
// Side-effect : configure le client API généré (BASE depuis l'env, token, refresh)
import '@/lib/api/client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111111',
              border: '1px solid #2a2a2a',
              color: '#e5e5e5',
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
