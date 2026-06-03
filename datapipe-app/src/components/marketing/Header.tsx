'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useCallback } from 'react'

// Effet magnétique local (repris de la landing)
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current!
    const r = el.getBoundingClientRect()
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.4}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`
  }, [])
  const onLeave = useCallback(() => { if (ref.current) ref.current.style.transform = '' }, [])
  return (
    <span ref={ref} className="magnetic" onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </span>
  )
}

const NAV = [
  { label: 'Produit', href: '/#features' },
  { label: 'Nœuds', href: '/noeuds' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Docs', href: '/docs' },
]

// Header "liquid glass" flottant — extrait tel quel de la landing page principale.
export function Header() {
  return (
    <>
      {/* Spacer pour compenser le header fixed */}
      <div style={{ height: 72 }} />

      <header style={{
        position: 'fixed',
        top: 16, left: 24, right: 24,
        zIndex: 50,
        isolation: 'isolate',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Liquid glass — fond */}
        <div style={{
          position: 'absolute', inset: 0,
          backdropFilter: 'blur(24px) saturate(200%) brightness(0.88)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(0.88)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 50%, rgba(255,109,53,0.03) 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 16,
          zIndex: -1,
        }} />

        {/* Shimmer iridescent */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: -1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,109,53,0.04) 30%, rgba(255,255,255,0.04) 60%, transparent 100%)',
          animation: 'shimmer 6s ease-in-out infinite',
        }} />

        {/* Ligne basse lumineuse */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, zIndex: -1,
          background: 'linear-gradient(90deg, transparent, rgba(255,109,53,0.3), rgba(255,255,255,0.15), rgba(255,109,53,0.3), transparent)',
        }} />

        {/* Contenu */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 52, padding: '0 20px',
        }}>
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="DataPipe" width={44} height={44} className="rounded-lg transition-transform duration-200 group-hover:scale-110" />
            <span className="text-sm font-bold text-white">DataPipe</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-gray-500 md:flex">
            {NAV.map(item => (
              <Link key={item.label} href={item.href} className="cursor-pointer hover:text-gray-200 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#ff6d35] after:transition-all hover:after:w-full">{item.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/demo" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Démo</Link>
            <Link href="/login" className="text-sm text-gray-400 hover:text-gray-100 transition-colors">Connexion</Link>
            <Magnetic>
              <Link href="/register"
                className="rounded-lg bg-[#ff6d35] px-4 py-2 text-sm font-light text-white transition-all hover:bg-[#e85e2a] active:scale-95"
                style={{ boxShadow: '0 2px 14px rgba(255,109,53,0.28)' }}>
                Commencer
              </Link>
            </Magnetic>
          </div>
        </div>
      </header>
    </>
  )
}
