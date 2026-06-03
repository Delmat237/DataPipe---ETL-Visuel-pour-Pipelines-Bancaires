'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword } from '@/lib/api/auth'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
      toast.success('Email envoyé si le compte existe')
    } catch {
      toast.error('Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-4">
      <div className="mb-8 flex items-center gap-3">
        <Image src="/logo.png" alt="DataPipe" width={56} height={56} className="rounded-xl" />
        <span className="text-xl font-bold tracking-tight text-gray-100">DataPipe</span>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-[#1e1e1e] bg-[#111111] p-8 shadow-xl">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">📧</div>
            <h1 className="text-xl font-semibold text-gray-100">Email envoyé !</h1>
            <p className="text-sm text-gray-500">Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.</p>
            <Link href="/login">
              <Button variant="outline" className="w-full mt-4 gap-2">
                <ArrowLeft className="h-4 w-4" /> Retour à la connexion
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-xl font-semibold text-gray-100">Mot de passe oublié</h1>
            <p className="mb-6 text-sm text-gray-500">Entrez votre email pour recevoir un lien de réinitialisation</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@acme.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Envoi…' : 'Envoyer le lien'}
              </Button>
            </form>
            <Link href="/login" className="mt-4 flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-gray-400">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
