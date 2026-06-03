import { OpenAPI } from '@/lib2'

/**
 * Configuration centrale du client API généré (lib2).
 *
 * - BASE     : dérivée de NEXT_PUBLIC_API_URL (+ /api/v1)
 * - TOKEN    : resolver qui injecte l'access_token courant sur chaque requête
 * - Refresh  : rafraîchissement proactif de l'access_token avant expiration
 *
 * Le client généré (fetch) n'a pas d'intercepteur 401 : on s'appuie donc sur
 * un refresh proactif basé sur `expires_in`, plus un refresh au démarrage.
 */

/**
 * Base de l'API.
 *
 * Par défaut on utilise un chemin RELATIF (`/api/v1`) : le navigateur appelle
 * la même origine que l'app, et le proxy Next (voir `next.config.ts`) relaie
 * vers le backend (VPS). Cela évite tout problème de CORS.
 *
 * `NEXT_PUBLIC_API_URL` reste possible pour cibler une API distante en direct
 * (le backend doit alors autoriser le CORS de cette origine).
 */
const API_ROOT = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? ''
export const API_BASE = `${API_ROOT}/api/v1`

/**
 * Base ABSOLUE du backend public, pour afficher des URLs appelables de
 * l'extérieur (ex: webhooks entrants). Contrairement à `API_BASE` (relative,
 * proxifiée), celle-ci pointe directement vers le VPS.
 */
const PUBLIC_API_ROOT = (
  process.env.NEXT_PUBLIC_PUBLIC_API_URL ?? 'http://datapipe.duckdns.org'
).replace(/\/+$/, '')
export const PUBLIC_API_BASE = `${PUBLIC_API_ROOT}/api/v1`

const REFRESH_STORAGE_KEY = 'dp_refresh_token'

let accessToken: string | null = null
let refreshToken: string | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

OpenAPI.BASE = API_BASE
OpenAPI.TOKEN = async () => accessToken ?? ''

function persistRefresh(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(REFRESH_STORAGE_KEY, token)
  else window.localStorage.removeItem(REFRESH_STORAGE_KEY)
}

function readPersistedRefresh(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(REFRESH_STORAGE_KEY)
}

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

function scheduleRefresh(expiresInSeconds?: number) {
  clearRefreshTimer()
  if (typeof window === 'undefined') return
  // Rafraîchit 60s avant l'expiration (min 30s), défaut 15min.
  const expires = expiresInSeconds && expiresInSeconds > 0 ? expiresInSeconds : 900
  const delayMs = Math.max(expires - 60, 30) * 1000
  refreshTimer = setTimeout(() => { void refreshAccessToken() }, delayMs)
}

export const authTokens = {
  getAccess: () => accessToken,
  getRefresh: () => refreshToken,
  isAuthenticated: () => Boolean(accessToken),

  /** Enregistre les tokens reçus après login / register / verify-email. */
  set(access: string, refresh?: string, expiresIn?: number) {
    accessToken = access
    if (refresh !== undefined) {
      refreshToken = refresh
      persistRefresh(refresh)
    }
    scheduleRefresh(expiresIn)
  },

  /** Vide tout l'état d'auth (logout / échec de refresh). */
  clear() {
    accessToken = null
    refreshToken = null
    clearRefreshTimer()
    persistRefresh(null)
  },
}

/**
 * Rafraîchit l'access_token via le refresh_token.
 *
 * Le backend protège `/auth/refresh-token` par `@jwt_required(refresh=True)` :
 * le refresh_token doit donc être envoyé dans l'en-tête Authorization, pas le
 * body. On fait un fetch direct plutôt que de passer par le client généré (qui
 * injecte l'access_token).
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) refreshToken = readPersistedRefresh()
  if (!refreshToken) return false

  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      body: '{}',
    })
    if (!res.ok) {
      authTokens.clear()
      return false
    }
    const data = (await res.json()) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }
    if (!data.access_token) {
      authTokens.clear()
      return false
    }
    authTokens.set(data.access_token, data.refresh_token, data.expires_in)
    return true
  } catch {
    authTokens.clear()
    return false
  }
}

/**
 * Initialise le client au démarrage : tente de restaurer une session depuis le
 * refresh_token persistant. Retourne true si une session a pu être restaurée.
 */
export async function initApiClient(): Promise<boolean> {
  refreshToken = readPersistedRefresh()
  if (!refreshToken) return false
  return refreshAccessToken()
}
