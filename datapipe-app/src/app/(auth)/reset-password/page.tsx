'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/lib/api/auth'
import { toast } from 'sonner'

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [token, setToken] = useState(params.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Min. 8 caractères'); return }
    if (password !== confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (!token.trim()) { toast.error('Token requis'); return }
    setIsLoading(true)
    try {
      await resetPassword(token, password)
      toast.success('Mot de passe réinitialisé')
      router.push('/login')
    } catch { toast.error('Token invalide ou expiré') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-[#1e1e1e] bg-[#111111] p-8 shadow-xl">
      <h1 className="mb-1 text-xl font-semibold text-gray-100">Nouveau mot de passe</h1>
      <p className="mb-6 text-sm text-gray-500">Choisissez un nouveau mot de passe pour votre compte</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!params.get('token') && (
          <div className="space-y-1.5">
            <Label htmlFor="token">Token de réinitialisation</Label>
            <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirmer</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Réinitialisation…' : 'Réinitialiser'}
        </Button>
      </form>
      <Link href="/login" className="mt-4 flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-gray-400">
        <ArrowLeft className="h-3.5 w-3.5" /> Retour
      </Link>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-4">
      <div className="mb-8 flex items-center gap-3">
        <Image src="/logo.png" alt="DataPipe" width={56} height={56} className="rounded-xl" />
        <span className="text-xl font-bold tracking-tight text-gray-100">DataPipe</span>
      </div>
      <Suspense fallback={<div className="text-gray-500 text-sm">Chargement…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
