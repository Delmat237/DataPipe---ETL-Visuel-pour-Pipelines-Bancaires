import { ApiKeysService } from '@/lib2'
import type { ApiKey } from '@/types'

type ApiKeyWithSecret = ApiKey & { key: string }

export const apiKeysApi = {
  async list(): Promise<ApiKey[]> {
    const raw = await ApiKeysService.getApiKeys()
    return (raw.api_keys ?? []) as unknown as ApiKey[]
  },

  /**
   * Crée une clé. Le backend n'accepte que le nom (les scopes sont gérés
   * côté front pour l'affichage) et renvoie la clé en clair une seule fois.
   */
  async create(data: { name: string; scopes: string[] }): Promise<ApiKeyWithSecret> {
    const raw = (await ApiKeysService.postApiKeys({ name: data.name })) as Record<string, unknown>
    const k = (raw.api_key ?? raw) as Record<string, unknown>
    const secret = String(raw.key ?? k.key ?? '')
    return {
      id: String(k.id ?? ''),
      name: String(k.name ?? data.name),
      prefix: String(k.prefix ?? secret.slice(0, 8)),
      scopes: (k.scopes as string[]) ?? data.scopes,
      created_at: String(k.created_at ?? new Date().toISOString()),
      last_used_at: k.last_used_at as string | undefined,
      key: secret,
    }
  },

  async revoke(keyId: string) {
    await ApiKeysService.deleteApiKeys(keyId)
  },
}
