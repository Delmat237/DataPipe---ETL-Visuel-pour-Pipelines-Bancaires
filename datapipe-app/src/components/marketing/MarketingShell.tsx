'use client'

import { Header } from './Header'
import { Footer } from './Footer'

// Même fond pointillé que la landing + header/footer extraits tels quels.
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden text-gray-200"
      style={{
        background: '#0a0a0b',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <Header />
      <main className="relative z-10">{children}</main>
      <Footer />
    </div>
  )
}

// Hero de page réutilisable (style landing)
export function PageHero({ tag, title, subtitle }: { tag: string; title: string; subtitle: string }) {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-16 pb-12 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff6d35] mb-3">{tag}</p>
      <h1 className="mx-auto max-w-2xl text-4xl font-light leading-tight tracking-tight text-white md:text-5xl">{title}</h1>
      <p className="mx-auto mt-5 max-w-md text-base text-gray-500 leading-relaxed">{subtitle}</p>
    </section>
  )
}
