'use client'

import { useEffect } from 'react'
import { Building2, Folder } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkspaceStore } from '@/store/workspace.store'

export function WorkspaceSwitcher() {
  const { orgs, workspaces, currentOrgId, currentWorkspaceId, init, selectOrg, selectWorkspace } = useWorkspaceStore()

  useEffect(() => { void init() }, [init])

  // Rien à afficher tant qu'aucune organisation n'est connue (mode démo / hors-ligne).
  if (orgs.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <Select value={currentOrgId ?? undefined} onValueChange={(v) => void selectOrg(v)}>
        <SelectTrigger className="h-8 w-40 gap-1.5 text-xs">
          <Building2 className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          <SelectValue placeholder="Organisation" />
        </SelectTrigger>
        <SelectContent>
          {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {workspaces.length > 0 && (
        <Select value={currentWorkspaceId} onValueChange={selectWorkspace}>
          <SelectTrigger className="h-8 w-40 gap-1.5 text-xs">
            <Folder className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <SelectValue placeholder="Workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
