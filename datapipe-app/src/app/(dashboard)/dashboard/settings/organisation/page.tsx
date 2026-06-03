'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, Users, Folder, Plus, Trash2, Mail, Save, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { orgsApi, type AppOrg, type AppMember, type MemberRole } from '@/lib/api/orgs'
import { workspacesApi, type AppWorkspace } from '@/lib/api/workspaces'
import { useWorkspaceStore } from '@/store/workspace.store'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

export default function OrganisationPage() {
  const { currentOrgId, refreshOrgs, refreshWorkspaces } = useWorkspaceStore()
  const [org, setOrg] = useState<AppOrg | null>(null)
  const [members, setMembers] = useState<AppMember[]>([])
  const [workspaces, setWorkspaces] = useState<AppWorkspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [orgName, setOrgName] = useState('')
  const [invite, setInvite] = useState({ email: '', role: 'editor' as MemberRole })
  const [inviteToken, setInviteToken] = useState('')
  const [newWs, setNewWs] = useState('')

  const load = useCallback(async (orgId: string | null) => {
    if (!orgId) { setIsLoading(false); return }
    setIsLoading(true)
    try {
      const [o, m, ws] = await Promise.all([
        orgsApi.get(orgId),
        orgsApi.listMembers(orgId).catch(() => []),
        workspacesApi.list(orgId).catch(() => []),
      ])
      setOrg(o)
      setOrgName(o.name)
      setMembers(m)
      setWorkspaces(ws)
    } catch { toast.error('Erreur de chargement') }
    finally { setIsLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(currentOrgId) }, [currentOrgId, load])

  const handleSaveOrg = async () => {
    if (!currentOrgId) return
    try { await orgsApi.update(currentOrgId, { name: orgName }); toast.success('Organisation mise à jour'); refreshOrgs() }
    catch { toast.error('Erreur') }
  }

  const handleDeleteOrg = async () => {
    if (!currentOrgId) return
    try { await orgsApi.remove(currentOrgId); toast.success('Organisation supprimée'); refreshOrgs() }
    catch { toast.error('Suppression refusée (rôle owner requis)') }
  }

  const handleInvite = async () => {
    if (!currentOrgId || !invite.email.trim()) return
    try { await orgsApi.invite(currentOrgId, invite.email, invite.role); toast.success('Invitation envoyée'); setInvite({ email: '', role: 'editor' }); load(currentOrgId) }
    catch { toast.error('Invitation impossible (rôle admin requis)') }
  }

  const handleAcceptInvite = async () => {
    if (!currentOrgId || !inviteToken.trim()) return
    try { await orgsApi.acceptInvite(currentOrgId, inviteToken); toast.success('Invitation acceptée'); setInviteToken(''); load(currentOrgId) }
    catch { toast.error('Token invalide') }
  }

  const handleRoleChange = async (m: AppMember, role: string) => {
    if (!currentOrgId) return
    try { await orgsApi.updateMemberRole(currentOrgId, m.user_id, role as 'viewer' | 'editor' | 'admin'); toast.success('Rôle mis à jour'); load(currentOrgId) }
    catch { toast.error('Erreur') }
  }

  const handleRemoveMember = async (m: AppMember) => {
    if (!currentOrgId) return
    try { await orgsApi.removeMember(currentOrgId, m.user_id); setMembers((p) => p.filter((x) => x.user_id !== m.user_id)); toast.success('Membre retiré') }
    catch { toast.error('Erreur') }
  }

  const handleCreateWs = async () => {
    if (!currentOrgId || !newWs.trim()) return
    try { await workspacesApi.create(currentOrgId, { name: newWs }); toast.success('Workspace créé'); setNewWs(''); load(currentOrgId); refreshWorkspaces() }
    catch { toast.error('Erreur') }
  }

  const handleDeleteWs = async (ws: AppWorkspace) => {
    if (!currentOrgId) return
    try { await workspacesApi.remove(currentOrgId, ws.id); setWorkspaces((p) => p.filter((x) => x.id !== ws.id)); toast.success('Workspace supprimé'); refreshWorkspaces() }
    catch { toast.error('Erreur') }
  }

  if (!currentOrgId) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
          <Building2 className="h-10 w-10 text-gray-700" />
          <p className="text-sm text-gray-600">Aucune organisation active. Connectez-vous à une API pour la gérer.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-foreground">Organisation &amp; équipe</h1>

      {/* Org */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Organisation</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          {isLoading ? <Skeleton className="h-10" /> : (
            <>
              <div className="flex items-center gap-2">
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="max-w-xs" />
                <Button onClick={handleSaveOrg} className="gap-2"><Save className="h-4 w-4" /> Enregistrer</Button>
                {org && <Badge variant="secondary" className="ml-2 uppercase">{org.plan}</Badge>}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>{org?.members_count ?? members.length} membres</span>
                {org?.storage_used_mb != null && <span>{org.storage_used_mb} MB utilisés</span>}
                <Button variant="ghost" size="sm" onClick={handleDeleteOrg} className="ml-auto text-red-400 hover:text-red-300 gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer l&apos;organisation
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Membres</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center gap-2">
            <Input placeholder="email@exemple.com" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} className="flex-1" />
            <Select value={invite.role} onValueChange={(v) => setInvite({ ...invite, role: v as MemberRole })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} className="gap-2"><Mail className="h-4 w-4" /> Inviter</Button>
          </div>

          <div className="flex items-center gap-2">
            <Input placeholder="Code d'invitation reçu…" value={inviteToken} onChange={(e) => setInviteToken(e.target.value)} className="flex-1" />
            <Button variant="outline" onClick={handleAcceptInvite} className="gap-2"><Ticket className="h-4 w-4" /> Accepter</Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : members.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-600">Aucun membre</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm text-foreground">{m.name || m.email}</p>
                    <p className="text-xs text-gray-600">{m.email}{m.joined_at ? ` · ${getRelativeTime(m.joined_at)}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.role === 'owner' ? (
                      <Badge variant="default" className="text-[10px] h-5">owner</Badge>
                    ) : (
                      <Select value={m.role} onValueChange={(v) => handleRoleChange(m, v)}>
                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveMember(m)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workspaces */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Folder className="h-4 w-4" /> Workspaces</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center gap-2">
            <Input placeholder="Nom du workspace" value={newWs} onChange={(e) => setNewWs(e.target.value)} className="flex-1" />
            <Button onClick={handleCreateWs} className="gap-2"><Plus className="h-4 w-4" /> Créer</Button>
          </div>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : workspaces.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-600">Aucun workspace</p>
          ) : (
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <div key={ws.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ws.color ?? '#6366f1' }} />
                    <div>
                      <p className="text-sm text-foreground">{ws.name}</p>
                      <p className="text-xs text-gray-600">{ws.pipelines_count ?? 0} pipelines</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteWs(ws)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
