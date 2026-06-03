'use client'

import Link from 'next/link'
import Image from 'next/image'

// Footer "liquid glass" — extrait tel quel de la landing page principale.
export function Footer() {
  return (
    // Wrapper pleine largeur pour centrer la card
    <div style={{ width: '100%', padding: '0 24px 48px', display: 'flex', justifyContent: 'center' }}>

      {/* LA CARD FOOTER — liquid glass, coins arrondis, largeur réduite */}
      <div style={{
        width: '100%',
        maxWidth: 'calc(100% - 48px)',
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, rgba(10,10,12,0.72) 40%, rgba(6,6,8,0.92) 100%)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.4)',
      }}>

        {/* Shimmer iridescent */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'linear-gradient(135deg, rgba(255,109,53,0.04) 0%, transparent 40%, rgba(255,255,255,0.02) 70%, transparent 100%)',
        }} />

        {/* Contenu — par-dessus le glass */}
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* Top section — brand + 4 colonnes */}
          <div style={{ padding: '44px 40px 36px' }}>
            <div className="grid gap-10 md:grid-cols-5">

              {/* Brand */}
              <div className="md:col-span-1 space-y-5">
                <Link href="/" className="flex items-center gap-2">
                  <Image src="/logo.png" alt="DataPipe" width={44} height={44} className="rounded-lg" />
                  <span className="text-sm font-bold text-gray-200">DataPipe</span>
                </Link>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  Pipelines visuels.<br />Propulsé par Claude.
                </p>
                <div className="flex items-center gap-2">
                  {['T', 'G', 'D', 'Li'].map(s => (
                    <div key={s}
                      className="flex h-7 w-7 items-center justify-center rounded-md cursor-pointer transition-all hover:bg-white/8"
                      style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
                      <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.28)' }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 colonnes */}
              {[
                { title: 'Produit',    links: ['Canvas visuel', '12 nœuds', 'IA Claude', 'Graphiques', 'Export', 'Templates', 'Changelog'] },
                { title: 'Solutions',  links: ['Finance', 'Logistique', 'E-commerce', 'RH', 'Data Science', 'Marketing', 'Opérations'] },
                { title: 'Ressources', links: ['Documentation', 'Guides', 'API Reference', 'Statut', 'Blog', 'Communauté'] },
                { title: 'Entreprise', links: ['À propos', 'Carrières', 'Contact', 'Presse', 'Partenaires', 'Légal'] },
              ].map(col => (
                <div key={col.title} className="space-y-3">
                  <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.42)' }}>{col.title}</p>
                  <ul className="space-y-2">
                    {col.links.map(l => (
                      <li key={l}>
                        <span
                          className="text-xs cursor-pointer transition-colors"
                          style={{ color: 'rgba(255,255,255,0.22)' }}
                          onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.72)')}
                          onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
                        >{l}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Séparateur */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 40px' }} />

          {/* Bloc intégrations n8n-style */}
          <div style={{ padding: '32px 40px' }}>
            <div className="grid gap-8 md:grid-cols-5">
              {[
                { title: 'Intégrations', links: ['PostgreSQL', 'MySQL', 'MongoDB', 'Google Sheets', 'Snowflake', 'BigQuery'] },
                { title: 'Combinaisons', links: ['CSV + IA Transform', 'SQL + Agrégation', 'JSON + Chart', 'API + Export'] },
                { title: 'Catégories',   links: ['Finance', 'Logistique', 'E-commerce', 'RH', 'Data Science'] },
                { title: 'Templates',    links: ['Réconciliation bancaire', 'Rapport KPIs', 'Analyse cohortes', 'OHADA'] },
                { title: 'Guides',       links: ['Premiers pas', 'Pipeline en 5 min', 'Nœud IA', 'Connecter une DB'] },
              ].map(col => (
                <div key={col.title} className="space-y-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>
                    {col.title}
                  </p>
                  <ul className="space-y-1.5">
                    {col.links.map(l => (
                      <li key={l}>
                        <span
                          className="text-xs cursor-pointer transition-colors"
                          style={{ color: 'rgba(255,255,255,0.16)' }}
                          onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                          onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.16)')}
                        >{l}</span>
                      </li>
                    ))}
                    <li>
                      <span
                        className="text-xs cursor-pointer transition-colors"
                        style={{ color: 'rgba(255,109,53,0.32)' }}
                        onMouseOver={e => (e.currentTarget.style.color = '#ff6d35')}
                        onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,109,53,0.32)')}
                      >Voir plus →</span>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Séparateur */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 40px' }} />

          {/* Bottom bar */}
          <div style={{
            padding: '16px 40px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
              {['Conditions', 'Confidentialité', 'Cookies', 'Signaler une vulnérabilité'].map(l => (
                <span
                  key={l}
                  className="text-xs cursor-pointer transition-colors"
                  style={{ color: 'rgba(255,255,255,0.14)' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.14)')}
                >{l}</span>
              ))}
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)' }}>
              © 2026 DataPipe · Hackathon J.U.I.N 2026 · Claude Sonnet 4.6
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}
