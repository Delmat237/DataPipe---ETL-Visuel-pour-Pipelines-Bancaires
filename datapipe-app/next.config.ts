import type { NextConfig } from 'next'

/**
 * Cible du backend (VPS). Surchargeable via la variable d'env `API_PROXY_TARGET`.
 * Le navigateur n'appelle JAMAIS cette URL directement : il passe par les
 * rewrites ci-dessous (même origine), ce qui supprime tout problème de CORS.
 */
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? 'http://datapipe.duckdns.org'

const nextConfig: NextConfig = {
  // Proxy : les requêtes same-origin /api/* sont relayées côté serveur vers le VPS.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
