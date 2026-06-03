import { AuthService, type User as ApiUser, type Session } from '@/lib2'
import type { User } from '@/types'
import { authTokens } from './client'

export type AppSession = {
  id: string
  device?: string
  ip?: string
  current: boolean
  created_at?: string
}

/** Normalise le User renvoyé par l'API (champs optionnels) vers le type app. */
export function toAppUser(u: ApiUser): User {
  return {
    id: u.id ?? '',
    email: u.email ?? '',
    name: u.name ?? '',
    avatar_url: u.avatar_url,
    verified: u.verified ?? false,
    created_at: u.created_at ?? new Date().toISOString(),
    orgs: (u.orgs ?? []).map((o) => ({
      id: o.id ?? '',
      name: o.name ?? '',
      role: o.role ?? 'viewer',
    })),
  }
}

export async function login(email: string, password: string) {
  const res = await AuthService.postAuthLogin({ email, password })
  if (res.access_token) {
    authTokens.set(res.access_token, res.refresh_token, res.expires_in)
  }
  return res
}

export async function register(data: {
  email: string
  password: string
  name: string
  org_name?: string
}) {
  return AuthService.postAuthRegister(data)
}

export async function logout() {
  try {
    await AuthService.postAuthLogout({ refresh_token: authTokens.getRefresh() ?? undefined })
  } catch {
    /* on vide quand même la session locale */
  } finally {
    authTokens.clear()
  }
}

export async function getCurrentUser(): Promise<User> {
  const u = await AuthService.getAuthMe()
  return toAppUser(u)
}

export async function forgotPassword(email: string) {
  return AuthService.postAuthForgotPassword({ email })
}

export async function updateProfile(data: { name?: string; avatar_url?: string }) {
  await AuthService.patchAuthMe(data)
  return data
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return AuthService.postAuthChangePassword({
    current_password: currentPassword,
    new_password: newPassword,
  })
}

export async function listSessions(): Promise<AppSession[]> {
  const res = await AuthService.getAuthSessions()
  return (res.sessions ?? []).map((s: Session) => ({
    id: s.id ?? '',
    device: s.device,
    ip: s.ip,
    current: s.current ?? false,
    created_at: s.created_at,
  }))
}

export async function revokeSession(sessionId: string) {
  return AuthService.deleteAuthSessions(sessionId)
}

export async function revokeAllSessions(exceptCurrent = true) {
  const res = await AuthService.postAuthRevokeAllSessions({ except_current: exceptCurrent })
  return res.revoked_count ?? 0
}

export async function verifyEmail(token: string) {
  return AuthService.postAuthVerifyEmail({ token })
}

export async function resetPassword(token: string, newPassword: string) {
  return AuthService.postAuthResetPassword({ token, new_password: newPassword })
}

export async function deleteAccount(password: string) {
  await AuthService.deleteAuthMe({ password })
  authTokens.clear()
}
