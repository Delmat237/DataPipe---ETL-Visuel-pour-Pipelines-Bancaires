'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Image from 'next/image'

export default function DemoPage() {
  const router = useRouter()
  const enableDemoMode = useAuthStore((s) => s.enableDemoMode)

  useEffect(() => {
    enableDemoMode()
    router.push('/dashboard')
  }, [enableDemoMode, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
      <div className="flex flex-col items-center gap-4">
        <Image src="/logo.png" alt="DataPipe" width={64} height={64} className="rounded-2xl animate-pulse" />
        <p className="text-sm text-gray-500">Chargement du mode démo…</p>
      </div>
    </div>
  )
}
