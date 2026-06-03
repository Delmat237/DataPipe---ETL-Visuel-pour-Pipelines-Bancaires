'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Plug, Key, Monitor, ShieldCheck, Trash2, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import {
  updateProfile, changePassword, listSessions, revokeSession, revokeAllSessions,
  verifyEmail, deleteAccount, type AppSession,
} from '@/lib/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser, clearAuth } = useAuthStore()
  const [name, setName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [isChangingPwd, setIsChangingPwd] = useState(false)
  const [sessions, setSessions] = useState<AppSession[]>([])
  const [verifyToken, setVerifyToken] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deletePwd, setDeletePwd] = useState('')
  const [deleting, setDeleting] = useState(false)

  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    listSessions().then(setSessions).catch(() => {})
  }, [])

  const handleRevokeSession = async (s: AppSession) => {
    try { await revokeSession(s.id); setSessions((p) => p.filter((x) => x.id !== s.id)); toast.success('Session révoquée') }
    catch { toast.error('Erreur') }
  }

  const handleRevokeAll = async () => {
    try {
      const count = await revokeAllSessions(true)
      toast.success(`${count} session(s) révoquée(s)`)
      listSessions().then(setSessions).catch(() => {})
    } catch { toast.error('Erreur') }
  }

  const handleVerifyEmail = async () => {
    if (!verifyToken.trim()) { toast.error('Token requis'); return }
    try {
      await verifyEmail(verifyToken)
      toast.success('Email vérifié')
      if (user) setUser({ ...user, verified: true })
      setVerifyToken('')
    } catch { toast.error('Token invalide') }
  }

  const handleDeleteAccount = async () => {
    if (!deletePwd) { toast.error('Mot de passe requis'); return }
    setDeleting(true)
    try {
      await deleteAccount(deletePwd)
      clearAuth()
      toast.success('Compte supprimé')
      router.push('/login')
    } catch { toast.error('Mot de passe incorrect') }
    finally { setDeleting(false) }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const updated = await updateProfile({ name, avatar_url: avatarUrl || undefined })
      setUser({ ...user!, ...updated })
      toast.success('Profil mis à jour')
    } catch { toast.error('Erreur') }
    finally { setIsSaving(false) }
  }

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (passwords.new.length < 8) {
      toast.error('Min. 8 caractères')
      return
    }
    setIsChangingPwd(true)
    try {
      await changePassword(passwords.current, passwords.new)
      setPasswords({ current: '', new: '', confirm: '' })
      toast.success('Mot de passe modifié. Toutes les sessions ont été révoquées.')
    } catch { toast.error('Mot de passe actuel incorrect') }
    finally { setIsChangingPwd(false) }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-foreground">Paramètres</h1>

      {/* Accès rapides */}
      <div className="grid grid-cols-3 gap-3">
        <SettingsLink href="/dashboard/settings/organisation" icon={<Building2 className="h-4 w-4 text-primary" />} label="Organisation & équipe" />
        <SettingsLink href="/dashboard/settings/integrations" icon={<Plug className="h-4 w-4 text-primary" />} label="Intégrations" />
        <SettingsLink href="/dashboard/settings/api-keys" icon={<Key className="h-4 w-4 text-primary" />} label="Clés API" />
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
          <CardDescription>Gérez vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="avatar">URL de l&apos;avatar</Label>
              <Input id="avatar" placeholder="https://…" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="opacity-50" />
          </div>
          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
        </CardContent>
      </Card>

      {/* Email verification */}
      {user && !user.verified && (
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-400" /> Vérification de l&apos;email</CardTitle>
            <CardDescription>Votre email n&apos;est pas encore vérifié. Saisissez le code reçu par email.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Input placeholder="Code de vérification" value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} className="max-w-xs" />
            <Button onClick={handleVerifyEmail}>Vérifier</Button>
          </CardContent>
        </Card>
      )}

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mot de passe</CardTitle>
          <CardDescription>Changer votre mot de passe révoquera toutes vos sessions actives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mot de passe actuel</Label>
            <Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Nouveau mot de passe</Label>
            <Input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmer</Label>
            <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
          </div>
          <Button onClick={handleChangePassword} disabled={isChangingPwd}>
            {isChangingPwd ? 'Modification…' : 'Changer le mot de passe'}
          </Button>
        </CardContent>
      </Card>

      {/* Sessions actives */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4" /> Sessions actives</CardTitle>
            <CardDescription>Appareils connectés à votre compte</CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button variant="outline" size="sm" onClick={handleRevokeAll} className="gap-2">
              <LogOut className="h-3.5 w-3.5" /> Tout révoquer
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-600 py-2">Aucune session listée</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground">{s.device ?? 'Appareil inconnu'}</p>
                    {s.current && <Badge variant="success" className="text-[10px] h-5">actuelle</Badge>}
                  </div>
                  <p className="text-xs text-gray-600">{s.ip ?? '—'}{s.created_at ? ` · ${getRelativeTime(s.created_at)}` : ''}</p>
                </div>
                {!s.current && (
                  <Button variant="ghost" size="icon-sm" onClick={() => handleRevokeSession(s)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-base text-red-400">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Supprimer mon compte</p>
              <p className="text-xs text-gray-600">Toutes vos données seront supprimées définitivement</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>Supprimer</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDelete} onOpenChange={(v) => { setShowDelete(v); if (!v) setDeletePwd('') }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-red-400">Supprimer mon compte</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-gray-500">Cette action est irréversible. Confirmez avec votre mot de passe.</p>
            <Input type="password" placeholder="Mot de passe" value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting || !deletePwd}>
              {deleting ? 'Suppression…' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SettingsLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-3 hover:border-primary/50 transition-colors">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">{icon}</div>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </Link>
  )
}
