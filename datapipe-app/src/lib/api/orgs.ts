import { OrganisationsService } from '@/lib2'
import type { Org, OrgMember } from '@/lib2'

export type MemberRole = 'viewer' | 'editor' | 'admin' | 'owner'

export type AppOrg = {
  id: string
  name: string
  slug?: string
  plan: 'free' | 'pro' | 'enterprise'
  members_count?: number
  storage_used_mb?: number
}

export type AppMember = {
  user_id: string
  name: string
  email: string
  role: MemberRole
  joined_at?: string
}

function toOrg(o: Org): AppOrg {
  return {
    id: o.id ?? '',
    name: o.name ?? '',
    slug: o.slug,
    plan: (o.plan ?? 'free') as AppOrg['plan'],
    members_count: o.members_count,
    storage_used_mb: o.storage_used_mb,
  }
}

function toMember(m: OrgMember): AppMember {
  return {
    user_id: m.user_id ?? '',
    name: m.name ?? '',
    email: m.email ?? '',
    role: (m.role ?? 'viewer') as MemberRole,
    joined_at: m.joined_at,
  }
}

export const orgsApi = {
  async list(): Promise<AppOrg[]> {
    const res = await OrganisationsService.getOrgs()
    return (res.orgs ?? []).map(toOrg)
  },

  async create(data: { name: string; plan?: 'free' | 'pro' | 'enterprise'; slug?: string }): Promise<AppOrg> {
    return toOrg(await OrganisationsService.postOrgs(data))
  },

  async get(orgId: string): Promise<AppOrg> {
    return toOrg(await OrganisationsService.getOrgs1(orgId))
  },

  async update(orgId: string, data: { name?: string; settings?: unknown }) {
    return toOrg(await OrganisationsService.patchOrgs(orgId, data))
  },

  async remove(orgId: string) {
    await OrganisationsService.deleteOrgs(orgId)
  },

  async listMembers(orgId: string): Promise<AppMember[]> {
    const res = await OrganisationsService.getOrgsMembers(orgId)
    return (res.members ?? []).map(toMember)
  },

  async invite(orgId: string, email: string, role: Exclude<MemberRole, 'owner'> | 'owner') {
    return OrganisationsService.postOrgsMembersInvite(orgId, { email, role })
  },

  async acceptInvite(orgId: string, token: string) {
    return OrganisationsService.postOrgsMembersAcceptInvite(orgId, { token })
  },

  async removeMember(orgId: string, userId: string) {
    await OrganisationsService.deleteOrgsMembers(orgId, userId)
  },

  async updateMemberRole(orgId: string, userId: string, role: 'viewer' | 'editor' | 'admin') {
    return OrganisationsService.patchOrgsMembers(orgId, userId, { role })
  },
}
