'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Zap, ArrowRight, Play, Check, Sparkles, BarChart3, LayoutGrid } from 'lucide-react'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth.store'
import { MiniPipeline, type MiniStep } from '@/components/marketing/MiniPipeline'
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
})
// ─────────────────────────────────────────────────────────────────────────
// Cursor glow — ref-based, zero re-renders
// ─────────────────────────────────────────────────────────────────────────
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!ref.current) return
      ref.current.style.left = `${e.clientX - 350}px`
      ref.current.style.top  = `${e.clientY - 350}px`
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-0 h-[700px] w-[700px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(255,109,53,0.07) 0%, transparent 60%)',
        transition: 'left 0.12s ease-out, top 0.12s ease-out',
        left: -350, top: -350,
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Tilt card — 3D tilt on mouse move
// ─────────────────────────────────────────────────────────────────────────
function TiltCard({ children, className = '', style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current!
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)
    const y = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)
    el.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) scale3d(1.02,1.02,1.02)`
    el.style.boxShadow = `${-x * 8}px ${y * 8}px 28px rgba(255,109,53,0.08), 0 0 0 1px rgba(255,109,53,0.15)`
  }, [])

  const onLeave = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform = ''
    ref.current.style.boxShadow = ''
  }, [])

  return (
    <div
      ref={ref}
      className={`bento-card ${className}`}
      style={{ ...style, transformStyle: 'preserve-3d' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Magnetic button wrapper
// ─────────────────────────────────────────────────────────────────────────
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current!
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.4
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.4
    el.style.transform = `translate(${x}px, ${y}px)`
  }, [])

  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = ''
  }, [])

  return (
    <span
      ref={ref}
      className="magnetic"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Scroll reveal
// ─────────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Reveal({ children, delay = 0, className = '', style }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties
}) {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(24px)',
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// CountUp
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const { ref, visible } = useInView()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!visible) return
    let f = 0
    const tick = () => { f++; setN(Math.round((f / 40) * to)); if (f < 40) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  }, [visible, to])
  return <span ref={ref}>{n}{suffix}</span>
}

// ─────────────────────────────────────────────────────────────────────────
// Typewriter (hero)
// ─────────────────────────────────────────────────────────────────────────
const TYPE_WORDS = ['vos CSV', 'vos JSON', 'vos bases SQL', 'vos APIs']

function Typewriter() {
  const [text, setText] = useState('')
  const [wi, setWi] = useState(0)
  const [del, setDel] = useState(false)
  useEffect(() => {
    const word = TYPE_WORDS[wi]
    const delay = del ? 42 : text.length === word.length ? 1800 : 75
    const t = setTimeout(() => {
      if (!del) {
        if (text.length < word.length) setText(word.slice(0, text.length + 1))
        else setDel(true)
      } else {
        if (text.length > 0) setText(text.slice(0, -1))
        else { setDel(false); setWi(i => (i + 1) % TYPE_WORDS.length) }
      }
    }, delay)
    return () => clearTimeout(t)
  }, [text, del, wi])
  return (
    <span className="text-[#ff6d35]">
      {text}
      <span className="ml-[2px] inline-block w-[3px] rounded-full bg-[#ff6d35]"
        style={{ height: '0.82em', verticalAlign: 'middle', animation: 'pulse-dot 1s ease-in-out infinite' }} />
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// AI Animated Card
// ─────────────────────────────────────────────────────────────────────────
const AI_PROMPT = "Crée une colonne tranche_âge à partir de la colonne age (0-18, 19-35, 36-60, 60+)"
const AI_CODE_LINES = [
  'df["tranche_age"] = pd.cut(',
  '  df["age"],',
  '  bins=[0, 18, 35, 60, 999],',
  '  labels=["<18", "19-35", "36-60", "60+"]',
  ')',
]

function AIAnimatedCard() {
  const { ref, visible } = useInView(0.2)
  const [prompt, setPrompt] = useState('')
  const [codeCount, setCodeCount] = useState(0)
  const [phase, setPhase] = useState<'idle'|'typing'|'wait'|'code'>('idle')

  useEffect(() => {
    if (visible && phase === 'idle') setPhase('typing')
  }, [visible, phase])

  useEffect(() => {
    if (phase === 'typing') {
      if (prompt.length < AI_PROMPT.length) {
        const t = setTimeout(() => setPrompt(AI_PROMPT.slice(0, prompt.length + 1)), 38)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => setPhase('code'), 600)
        return () => clearTimeout(t)
      }
    }
    if (phase === 'code') {
      if (codeCount < AI_CODE_LINES.length) {
        const t = setTimeout(() => setCodeCount(c => c + 1), 160)
        return () => clearTimeout(t)
      }
    }
  }, [phase, prompt, codeCount])

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl"
      style={{ background: '#0e0e14', border: '1px solid rgba(255,109,53,0.18)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,109,53,0.06)' }}>
        <Sparkles className="h-3.5 w-3.5 text-[#ff6d35]" />
        <span className="text-xs font-semibold text-[#ff6d35]">IA Transform</span>
        <span className="ml-auto text-[10px] text-gray-700">Claude Sonnet 4.6</span>
      </div>

      {/* Prompt area */}
      <div className="px-5 py-4 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-gray-700 mb-2">Prompt</p>
        <p className="text-sm text-gray-300 leading-relaxed min-h-[3em]">
          {prompt}
          {phase === 'typing' && (
            <span className="ml-0.5 inline-block h-[1em] w-[2px] rounded-full bg-gray-400 align-middle"
              style={{ animation: 'pulse-dot 0.8s ease-in-out infinite' }} />
          )}
        </p>
      </div>

      {/* Code area */}
      <div className="mx-4 mb-4 rounded-xl overflow-hidden"
        style={{ background: '#07070b', border: '1px solid rgba(255,255,255,0.06)', minHeight: 130 }}>
        <div className="flex items-center gap-1.5 border-b px-3 py-2"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="h-2 w-2 rounded-full bg-red-500/60" />
          <div className="h-2 w-2 rounded-full bg-amber-500/60" />
          <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
          <span className="ml-2 text-[10px] text-gray-700 font-mono">transform.py</span>
        </div>
        <div className="p-3">
          {codeCount > 0 && (
            <div className="font-mono text-[11px] leading-relaxed space-y-0">
              {AI_CODE_LINES.slice(0, codeCount).map((line, i) => (
                <div
                  key={i}
                  style={{ animation: `code-line-in 0.25s cubic-bezier(0.16,1,0.3,1) both` }}
                >
                  <span className="text-gray-600 select-none mr-3">{i + 1}</span>
                  <span style={{ color: line.includes('df[') ? '#79c0ff' : line.includes('"') ? '#a5d6ff' : '#e5e5e5' }}>
                    {line}
                  </span>
                </div>
              ))}
              {phase === 'code' && codeCount < AI_CODE_LINES.length && (
                <div style={{ paddingLeft: 30 }}>
                  <span className="inline-block h-[1em] w-[2px] rounded-full bg-[#ff6d35]"
                    style={{ animation: 'pulse-dot 0.6s ease-in-out infinite', verticalAlign: 'middle' }} />
                </div>
              )}
            </div>
          )}
          {codeCount === 0 && phase !== 'code' && (
            <div className="h-20 flex items-center justify-center">
              <span className="text-[10px] text-gray-700">En attente du prompt…</span>
            </div>
          )}
        </div>
      </div>

      {/* Result badge */}
      {codeCount >= AI_CODE_LINES.length && (
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', animation: 'slide-up 0.4s ease both' }}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 2s infinite' }} />
          <span className="text-[11px] font-mono text-emerald-400">Transformation appliquée · +1 colonne</span>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Bento Grid
// ─────────────────────────────────────────────────────────────────────────
function BentoGrid() {
  return (
    <section id="features" className="mx-auto max-w-5xl px-6 py-24 scroll-mt-16">
      <Reveal className="mb-12 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff6d35]">Tout dans un outil</p>
        <h2 className="mt-3 text-3xl font-light text-white md:text-4xl">Conçu pour aller vite.</h2>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Big card — canvas */}
        <Reveal delay={0} className="col-span-2 row-span-2">
          <TiltCard
            className="h-full min-h-[280px] overflow-hidden rounded-2xl p-6"
            style={{ background: '#0f0f13', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-3">Canvas visuel</p>
            <h3 className="text-lg font-bold text-white mb-1">Glisser-déposer</h3>
            <p className="text-sm text-gray-500 mb-6">Construisez en temps réel, voyez l&apos;exécution se propager.</p>
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 space-y-2">
              {[
                { label: 'CSV Import', color: '#00e5a0', sub: '1 247 lignes' },
                { label: 'Filtre',     color: '#ff6d35', sub: 'montant > 500' },
                { label: 'Export',     color: '#ff6d35', sub: 'rapport.csv' },
              ].map((n, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors hover:bg-white/4"
                    style={{ borderColor: n.color + '30', background: n.color + '0a' }}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: n.color }} />
                    <span className="text-xs font-semibold" style={{ color: n.color }}>{n.label}</span>
                    <span className="ml-auto text-[10px] text-gray-700 font-mono">{n.sub}</span>
                  </div>
                  {i < 2 && <div className="ml-5 h-3 w-px bg-[#2a2a2a]" />}
                </div>
              ))}
            </div>
          </TiltCard>
        </Reveal>

        {/* AI */}
        <Reveal delay={60} className="col-span-2 md:col-span-1">
          <TiltCard
            className="overflow-hidden rounded-2xl p-5"
            style={{ background: '#0f0f13', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'rgba(255,109,53,0.12)', border: '1px solid rgba(255,109,53,0.2)' }}>
              <Sparkles className="h-4 w-4 text-[#ff6d35]" />
            </div>
            <h3 className="text-sm font-bold text-white">IA Claude</h3>
            <p className="mt-1 text-xs text-gray-600">Décrivez, le code est généré.</p>
            <div className="mt-3 rounded-lg p-2.5" style={{ background: '#0a0a0e', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[9px] text-[#79c0ff] font-mono">df[&quot;tranche&quot;] = pd.cut(...</p>
            </div>
          </TiltCard>
        </Reveal>

        {/* Speed */}
        <Reveal delay={100} className="col-span-2 md:col-span-1">
          <TiltCard
            className="overflow-hidden rounded-2xl p-5"
            style={{ background: '#0f0f13', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Zap className="h-4 w-4 text-emerald-400" fill="currentColor" />
            </div>
            <p className="text-2xl font-black text-white">0.9s</p>
            <p className="text-xs text-gray-600 mt-0.5">Exécution moyenne</p>
            <div className="mt-3 flex items-end gap-1 h-8">
              {[90,70,85,60,95,80,75,88,65,92].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm transition-all duration-200 hover:opacity-100"
                  style={{ height: `${h}%`, background: `rgba(16,185,129,${0.2 + i * 0.03})` }} />
              ))}
            </div>
          </TiltCard>
        </Reveal>

        {/* Nodes count */}
        <Reveal delay={140} className="col-span-2 md:col-span-1">
          <TiltCard
            className="overflow-hidden rounded-2xl p-5"
            style={{ background: '#0f0f13', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'rgba(255,109,53,0.12)', border: '1px solid rgba(255,109,53,0.2)' }}>
              <LayoutGrid className="h-4 w-4 text-[#ff6d35]" />
            </div>
            <p className="text-2xl font-black text-white">12</p>
            <p className="text-xs text-gray-600 mt-0.5">Types de nœuds</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {['#00e5a0','#00e5a0','#00e5a0','#ff6d35','#ff6d35','#ff6d35','#ff6d35','#ff6d35','#ff6d35','#ff6d35','#ff6d35','#ff6d35'].map((c, i) => (
                <div key={i} className="h-3 w-3 rounded-sm transition-all duration-150 hover:scale-125 cursor-default"
                  style={{ background: c + '55', border: `1px solid ${c}35` }} />
              ))}
            </div>
          </TiltCard>
        </Reveal>

        {/* Chart */}
        <Reveal delay={180} className="col-span-2 md:col-span-1">
          <TiltCard
            className="overflow-hidden rounded-2xl p-5"
            style={{ background: '#0f0f13', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: 'rgba(255,109,53,0.12)', border: '1px solid rgba(255,109,53,0.2)' }}>
                <BarChart3 className="h-4 w-4 text-[#ff6d35]" />
              </div>
              <span className="text-[10px] text-gray-700">Bar · Line · Pie · Area</span>
            </div>
            <h3 className="text-sm font-bold text-white">Graphiques live</h3>
            <div className="mt-3 flex items-end gap-1.5 h-10">
              {[40,65,50,80,55,90,70].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm transition-all duration-200 hover:opacity-100"
                  style={{ height: `${h}%`, background: `rgba(255,109,53,${0.3 + i * 0.06})` }} />
              ))}
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// AI Section — big animated card
// ─────────────────────────────────────────────────────────────────────────
function AISection() {
  return (
    <section className="border-t py-24" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:gap-16">
          {/* Left — big animated card */}
          <div className="w-full md:w-[52%] shrink-0">
            <AIAnimatedCard />
          </div>

          {/* Right — text */}
          <Reveal className="flex-1 space-y-5 md:pt-4">
            <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: 'rgba(255,109,53,0.12)', border: '1px solid rgba(255,109,53,0.25)', color: '#ff6d35' }}>
              IA
            </span>
            <h3 className="text-2xl font-light leading-snug text-white md:text-3xl">
              Décrivez en français.<br />
              L&apos;IA écrit le code.
            </h3>
            <p className="text-base text-gray-500 leading-relaxed">
              Claude Sonnet analyse vos colonnes, comprend votre intention, et génère une transformation Python ou SQL — affichée, modifiable, exécutable en un clic.
            </p>
            <ul className="space-y-2.5">
              {[
                'Prompt en langage naturel, pas de SQL requis',
                'Code généré visible et toujours éditable',
                'Exécution immédiate sur vos données réelles',
              ].map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6d35]" />
                  {pt}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Animated canvas hero
// ─────────────────────────────────────────────────────────────────────────
function HeroCanvas() {
  const [on, setOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOn(true), 250); return () => clearTimeout(t) }, [])

  // Vrais nœuds de l'application
  const steps: MiniStep[] = [
    { slug: 'csv_reader',   label: 'Ventes 2024' },
    { slug: 'filter',       label: 'Filtre' },
    { slug: 'ai_transform', label: 'IA Transform' },
    { slug: 'chart',        label: 'Graphique' },
  ]

  return (
    <div className="relative h-[230px] w-full overflow-hidden rounded-b-xl flex items-center justify-center" style={{ background: '#08080c' }}>
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }} />
      <div className="relative px-6" style={{
        opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(12px)',
        transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <MiniPipeline steps={steps} size={62} running />
      </div>
      <div className="absolute bottom-4 right-5 flex items-center gap-2 rounded-full border px-3 py-1.5"
        style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.08)', opacity: on ? 1 : 0, transition: 'opacity 0.5s ease 700ms' }}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
        <span className="text-[10px] font-mono text-emerald-400">1 247 lignes · 0.9s</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Actors
// ─────────────────────────────────────────────────────────────────────────
interface Actor { role: string; desc: string; steps: MiniStep[] }

const ACTORS: Actor[] = [
  { role: 'Data Analyst', desc: 'Nettoyer et analyser les ventes', steps: [
    { slug: 'csv_reader', label: 'Ventes 2024' },
    { slug: 'dedup',      label: 'Nettoyage' },
    { slug: 'aggregate',  label: 'Agrégation' },
    { slug: 'chart',      label: 'Graphique' },
  ]},
  { role: 'BI Manager', desc: 'Consolider les KPIs multi-sources', steps: [
    { slug: 'sql_query',   label: 'KPIs' },
    { slug: 'join',        label: 'Join équipes' },
    { slug: 'map',         label: 'Renommage' },
    { slug: 'file_export', label: 'Export' },
  ]},
  { role: 'Développeur', desc: 'Transformer des payloads API', steps: [
    { slug: 'http_request',  label: 'API Stripe' },
    { slug: 'ai_transform',  label: 'IA Transform' },
    { slug: 'filter',        label: 'Filtre' },
    { slug: 'table_preview', label: 'Aperçu' },
  ]},
  { role: 'Finance', desc: 'Préparer les rapports comptables', steps: [
    { slug: 'csv_reader',  label: 'Grand livre' },
    { slug: 'filter',      label: 'Filtre' },
    { slug: 'aggregate',   label: 'Somme/compte' },
    { slug: 'file_export', label: 'Balance' },
  ]},
  { role: 'Opérations', desc: 'Surveiller les métriques livraison', steps: [
    { slug: 'json_reader',   label: 'Webhook' },
    { slug: 'join',          label: 'Transporteurs' },
    { slug: 'ai_transform',  label: 'Score retards' },
    { slug: 'chart',         label: 'Graphique' },
  ]},
]

function ActorsSection() {
  const [active, setActive] = useState(0)
  const [key, setKey] = useState(0)
  const pick = useCallback((i: number) => { if (i === active) return; setActive(i); setKey(k => k + 1) }, [active])

  return (
    <section className="border-t py-28" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff6d35] mb-3">Cas d&apos;usage</p>
          <h2 className="text-4xl font-light text-white leading-tight">Chaque équipe peut.</h2>
          <p className="mt-4 max-w-sm text-base text-gray-500">Cliquez sur un rôle pour voir le pipeline qu&apos;il construit — avec les vrais nœuds de DataPipe.</p>
        </Reveal>
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-20">
          <div className="w-full lg:w-64 shrink-0">
            {ACTORS.map((a, i) => (
              <button key={i} onClick={() => pick(i)}
                className="group flex w-full items-start gap-4 py-4 text-left"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full transition-all duration-300"
                  style={{ background: active === i ? '#ff6d35' : 'rgba(255,255,255,0.1)',
                    boxShadow: active === i ? '0 0 8px rgba(255,109,53,0.5)' : 'none' }} />
                <div>
                  <p className="text-sm font-semibold transition-colors duration-200"
                    style={{ color: active === i ? '#ffffff' : 'rgba(255,255,255,0.32)' }}>
                    {a.role}
                  </p>
                  <p className="mt-0.5 text-xs transition-colors duration-200"
                    style={{ color: active === i ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)' }}>
                    {a.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex-1">
            <div key={key}
              className="rounded-2xl p-6 flex flex-col"
              style={{ background: '#0e0e12', border: '1px solid rgba(255,255,255,0.07)', animation: 'slide-in-right 0.28s cubic-bezier(0.16,1,0.3,1) both' }}
            >
              <p className="mb-6 text-xs font-semibold text-gray-600 uppercase tracking-widest">
                Pipeline · {ACTORS[active].role}
              </p>
              {/* Vrais nœuds de l'application, reliés horizontalement */}
              <div className="flex-1 flex items-center justify-center py-6 overflow-x-auto">
                <MiniPipeline steps={ACTORS[active].steps} size={62} running />
              </div>
              <div className="mt-4 flex items-center gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 2s infinite' }} />
                <span className="text-[11px] font-mono text-emerald-400">Exécution terminée · 0.9s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Sticky features
// ─────────────────────────────────────────────────────────────────────────
// ─── Feature visual 1 — Import (auto-animating upload) ────────────────────
const IMPORT_FILES = [
  { name: 'ventes_2024.csv',     size: '2.4 MB',  rows: 12847,  schema: ['id','montant','région','date'] },
  { name: 'clients_export.json', size: '890 KB',   rows: 3204,   schema: ['client_id','nom','email','pays'] },
  { name: 'transactions.csv',    size: '45 MB',    rows: 189432, schema: ['tx_id','compte','montant','statut'] },
]
type FilePhase = 'idle' | 'loading' | 'done'

function ImportVisual() {
  const { ref, visible } = useInView(0.3)
  const [phases, setPhases]   = useState<FilePhase[]>(['idle','idle','idle'])
  const [progress, setProgress] = useState([0,0,0])
  const [expanded, setExpanded] = useState<number|null>(null)
  const running = useRef(false)

  const run = useCallback(() => {
    if (running.current) return
    running.current = true
    setPhases(['idle','idle','idle'])
    setProgress([0,0,0])
    setExpanded(null)

    IMPORT_FILES.forEach((_, fi) => {
      setTimeout(() => {
        setPhases(p => { const n=[...p]; n[fi]='loading'; return n })
        let pct = 0
        const speed = fi === 2 ? 40 : 18
        const iv = setInterval(() => {
          pct += fi === 2 ? 2 : 6
          setProgress(p => { const n=[...p]; n[fi]=Math.min(pct,100); return n })
          if (pct >= 100) {
            clearInterval(iv)
            setPhases(p => { const n=[...p]; n[fi]='done'; return n })
            if (fi === IMPORT_FILES.length - 1) {
              running.current = false
              setTimeout(run, 5000)
            }
          }
        }, speed)
      }, fi * 900)
    })
  }, [])

  useEffect(() => { if (visible) setTimeout(run, 500) }, [visible, run])

  return (
    <div ref={ref} className="space-y-1.5">
      {IMPORT_FILES.map((f, i) => (
        <div key={i}>
          <div
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
            style={{
              background: expanded === i ? 'rgba(255,109,53,0.06)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${expanded===i ? 'rgba(255,109,53,0.3)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <div className="h-2 w-2 shrink-0 rounded-full" style={{
              background: phases[i]==='done' ? '#10b981' : phases[i]==='loading' ? '#3b82f6' : 'rgba(255,255,255,0.12)',
              animation: phases[i]==='loading' ? 'pulse-dot 1.2s infinite' : 'none',
            }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 truncate">{f.name}</p>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {phases[i]==='done'
                  ? `${f.size} · ${f.rows.toLocaleString('fr-FR')} lignes`
                  : phases[i]==='loading'
                  ? `${f.size} · ${progress[i]}%`
                  : f.size}
              </p>
            </div>
            {phases[i]==='loading' && (
              <div className="w-14 h-1 rounded-full overflow-hidden shrink-0" style={{ background:'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full bg-blue-400" style={{ width:`${progress[i]}%`, transition:'width 0.1s linear' }} />
              </div>
            )}
          </div>
          {expanded===i && phases[i]==='done' && (
            <div className="mx-2 -mt-1 rounded-b-xl px-4 py-2.5" style={{
              background:'rgba(255,109,53,0.04)', border:'1px solid rgba(255,109,53,0.18)', borderTop:'none',
              animation:'slide-up 0.2s ease',
            }}>
              <p className="text-[9px] uppercase tracking-widest text-gray-700 mb-1.5">Colonnes détectées</p>
              <div className="flex flex-wrap gap-1.5">
                {f.schema.map(col => (
                  <span key={col} className="text-[10px] font-mono text-[#ff6d35] rounded px-1.5 py-0.5" style={{ background:'rgba(255,109,53,0.1)' }}>{col}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Feature visual 2 — Transform (clickable operator + aggregation) ───────
const OPS = ['>', '>=', '<', '<=', '==', '!='] as const
type Op = typeof OPS[number]
const OP_COUNTS: Record<Op,number> = { '>':4231,'>=':5102,'<':8616,'<=':7745,'==':1847,'!=':11000 }
const AGGS = { SUM:'1 234 567 €', COUNT:'12 847', AVG:'96.1 €', MAX:'4 872 €' } as const

function TransformVisual() {
  const [op, setOp]   = useState<Op>('>')
  const [agg, setAgg] = useState<keyof typeof AGGS>('SUM')

  return (
    <div className="space-y-3">
      <div className="rounded-xl px-4 py-3.5" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] uppercase tracking-widest text-gray-700 mb-2.5">Filtre actif</p>
        <p className="font-mono text-sm text-gray-200">
          montant{' '}
          <button
            onClick={() => setOp(OPS[(OPS.indexOf(op)+1) % OPS.length])}
            className="rounded px-1.5 py-0.5 font-bold transition-all hover:bg-[#ff6d35]/20 active:scale-90 cursor-pointer"
            style={{ color:'#ff6d35' }} title="Cliquer pour changer l'opérateur"
          >{op}</button>
          {' '}500
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-mono text-emerald-400 transition-all">
            {OP_COUNTS[op].toLocaleString('fr-FR')} lignes retenues sur 12 847
          </span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(AGGS) as Array<keyof typeof AGGS>).map(fn => (
          <button key={fn} onClick={() => setAgg(fn)} className="rounded-lg py-2 text-center transition-all active:scale-95" style={{
            background: agg===fn ? 'rgba(255,109,53,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${agg===fn ? 'rgba(255,109,53,0.4)' : 'rgba(255,255,255,0.07)'}`,
          }}>
            <p className="text-xs font-bold font-mono" style={{ color: agg===fn ? '#ff6d35' : '#6b7280' }}>{fn}</p>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-[10px] text-gray-600 font-mono">{agg}(montant) =</span>
        <span className="ml-auto text-sm font-bold text-white font-mono">{AGGS[agg]}</span>
      </div>
    </div>
  )
}

// ─── Feature visual 3 — Visualise (animated bars + click + sort + export) ──
const CHART_BARS = [
  { label:'IDF', v:92, name:'Île-de-France',           ca:'2.4M€' },
  { label:'ARA', v:67, name:'Auvergne-Rhône-Alpes',    ca:'1.7M€' },
  { label:'OCC', v:54, name:'Occitanie',                ca:'1.4M€' },
  { label:'NOR', v:43, name:'Normandie',                ca:'1.1M€' },
  { label:'BFC', v:38, name:'Bourgogne-F-Comté',        ca:'980K€' },
  { label:'PDL', v:61, name:'Pays de la Loire',         ca:'1.6M€' },
]

function VisualiseVisual() {
  const { ref, visible } = useInView(0.3)
  const [animated, setAnimated] = useState(false)
  const [selected, setSelected] = useState<number|null>(null)
  const [sorted,   setSorted]   = useState(false)
  const [exported, setExported] = useState(false)

  useEffect(() => { if (visible) setTimeout(() => setAnimated(true), 200) }, [visible])

  const bars = sorted ? [...CHART_BARS].sort((a,b) => b.v-a.v) : CHART_BARS

  const doExport = () => { setExported(true); setTimeout(() => setExported(false), 1800) }

  return (
    <div ref={ref} className="space-y-3">
      <div className="relative flex items-end gap-2 h-20">
        {bars.map((b, i) => (
          <div
            key={b.label}
            onClick={() => setSelected(selected===i ? null : i)}
            className="flex flex-1 flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-full rounded-t-md transition-all duration-500" style={{
              height: animated ? `${b.v}%` : '0%',
              transitionDelay: `${i*55}ms`,
              background: selected===i ? '#ff6d35' : `rgba(255,109,53,${0.28+i*0.05})`,
              boxShadow: selected===i ? '0 0 10px rgba(255,109,53,0.45)' : 'none',
            }} />
            <span className="text-[8px] transition-colors" style={{ color: selected===i ? '#ff6d35' : '#4b5563' }}>{b.label}</span>
          </div>
        ))}
        {selected !== null && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap pointer-events-none"
            style={{ background:'#ff6d35', boxShadow:'0 4px 14px rgba(255,109,53,0.4)', animation:'slide-up 0.2s ease' }}>
            {bars[selected].name} · {bars[selected].ca}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setSorted(s => !s)}
          className="flex-1 rounded-lg py-2 text-[11px] font-semibold transition-all hover:bg-white/6 active:scale-95"
          style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${sorted?'rgba(255,109,53,0.35)':'rgba(255,255,255,0.07)'}`, color:sorted?'#ff6d35':'#6b7280' }}
        >
          {sorted ? 'Trié ↓' : 'Trier ↓'}
        </button>
        <button
          onClick={doExport}
          className="flex-1 rounded-lg py-2 text-[11px] font-semibold transition-all active:scale-95"
          style={{
            background: exported ? 'rgba(16,185,129,0.12)' : 'rgba(255,109,53,0.1)',
            border: `1px solid ${exported?'rgba(16,185,129,0.3)':'rgba(255,109,53,0.25)'}`,
            color: exported ? '#10b981' : '#ff6d35',
          }}
        >
          {exported ? '✓ Téléchargé' : 'Exporter CSV'}
        </button>
      </div>
    </div>
  )
}

// ─── Feature definitions (texte/structure inchangés) ───────────────────────
const FEATURES = [
  {
    tag: 'Import', color: '#00e5a0', bg: '#0a0a0b',
    title: "Vos données dans l'éditeur en 30 secondes.",
    body: "Uploadez un CSV, collez une URL d'API, ou tapez du SQL. DataPipe détecte le schéma et infère les types.",
    Visual: ImportVisual,
  },
  {
    tag: 'Transform', color: '#ff6d35', bg: '#0c0c10',
    title: 'Configurez, prévisualisez, ajustez.',
    body: 'Filter, Join, Aggregate, Rename, Clean — chaque nœud est une boîte de dialogue. Configurez en cliquant.',
    Visual: TransformVisual,
  },
  {
    tag: 'Visualise', color: '#ff6d35', bg: '#0e0e13',
    title: 'Voyez le résultat, ajustez, exportez.',
    body: "Après chaque run, consultez les données dans la console, générez un graphique en un clic, ou téléchargez.",
    Visual: VisualiseVisual,
  },
]

function StickyFeatures() {
  return (
    /* Le wrapper doit être non-overflow pour que sticky fonctionne */
    <section className="border-t relative" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      {FEATURES.map((f, i) => (
        <div
          key={i}
          className="sticky top-0 flex items-center"
          style={{
            /* z-index croissant : chaque carte passe par-dessus la précédente */
            zIndex: 10 + i * 10,
            minHeight: '100vh',
            background: f.bg,
            /* Coins arrondis en haut pour l'effet "carte qui monte" */
            borderRadius: i > 0 ? '28px 28px 0 0' : undefined,
            /* Ombre portée vers le haut — crée la profondeur entre les cartes */
            boxShadow: i > 0 ? '0 -20px 60px rgba(0,0,0,0.55)' : undefined,
          }}
        >
          {/* Trait supérieur décoratif sur les cartes 2 et 3 */}
          {i > 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)' }} />
          )}

          <div
            className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-20 md:flex-row md:items-center md:gap-20"
            style={{ flexDirection: i % 2 === 0 ? undefined : 'row-reverse' }}
          >
            <Reveal className="flex-1 space-y-5">
              <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: 'rgba(255,109,53,0.12)', border: '1px solid rgba(255,109,53,0.25)', color: '#ff6d35' }}>
                {f.tag}
              </span>
              <h3 className="text-2xl font-light leading-snug text-white md:text-3xl">{f.title}</h3>
              <p className="text-base text-gray-500 leading-relaxed">{f.body}</p>
            </Reveal>
            <Reveal delay={100} className="w-full md:w-100 shrink-0 rounded-2xl p-5"
              style={{ background: '#111116', border: '1px solid rgba(255,255,255,0.06)' }}>
              <f.Visual />
            </Reveal>
          </div>
        </div>
      ))}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Nodes
// ─────────────────────────────────────────────────────────────────────────
const NODE_LIST = [
  { label: 'CSV Import',    cat: 'Source',    c: '#00e5a0' },
  { label: 'JSON Loader',   cat: 'Source',    c: '#00e5a0' },
  { label: 'SQL Query',     cat: 'Source',    c: '#00e5a0' },
  { label: 'Filtre',        cat: 'Transform', c: '#ff6d35' },
  { label: 'Join',          cat: 'Transform', c: '#ff6d35' },
  { label: 'Agrégation',    cat: 'Transform', c: '#ff6d35' },
  { label: 'Rename',        cat: 'Transform', c: '#ff6d35' },
  { label: 'Nettoyage',     cat: 'Transform', c: '#ff6d35' },
  { label: 'IA Transform',  cat: 'IA',        c: '#ff6d35' },
  { label: 'Table Preview', cat: 'Output',    c: '#ff6d35' },
  { label: 'Chart',         cat: 'Output',    c: '#ff6d35' },
  { label: 'Export',        cat: 'Output',    c: '#ff6d35' },
]

function NodesSection() {
  return (
    <section className="border-t py-24" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff6d35] mb-3">12 nœuds</p>
          <h2 className="text-3xl font-light text-white">Tout pour vos pipelines.</h2>
        </Reveal>
        <Reveal delay={80}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {NODE_LIST.map((n, i) => (
              <div key={i}
                className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-default transition-all duration-150 hover:-translate-y-0.5 group"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="h-2 w-2 shrink-0 rounded-full transition-all duration-200 group-hover:scale-125"
                  style={{ background: n.c, boxShadow: `0 0 6px ${n.c}60` }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-300 truncate group-hover:text-white transition-colors">{n.label}</p>
                  <p className="text-[10px] text-gray-700">{n.cat}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Testimonials
// ─────────────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { q: "DataPipe nous a permis de réduire nos traitements ETL de 3 jours à 20 minutes. L'IA transforme les colonnes sans une ligne de code.", name: 'Sophie M.', role: 'Data Analyst · Fintech' },
  { q: "Le canvas visuel est bluffant. On construit des pipelines complexes en glissant des nœuds, exactement comme sur un tableau blanc.", name: 'Thomas L.', role: 'Lead Dev · E-commerce' },
  { q: "L'export direct et les graphiques intégrés, c'est ce qu'il nous manquait. On livre nos rapports directement depuis DataPipe.", name: 'Camille R.', role: 'BI Manager · Retail' },
]

function TestimonialsSection() {
  return (
    <section className="border-t py-24" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-600">Retours</p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 80}>
              <TiltCard
                className="flex h-full flex-col justify-between rounded-2xl p-6"
                style={{ background: '#0e0e12', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-sm text-gray-400 leading-relaxed">&ldquo;{t.q}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black"
                    style={{ background: 'rgba(255,109,53,0.15)', color: '#ff6d35' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-300">{t.name}</p>
                    <p className="text-[10px] text-gray-600">{t.role}</p>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────
function Footer() {
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
        // Liquid glass : transparent en haut → sombre en bas
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, rgba(10,10,12,0.72) 40%, rgba(6,6,8,0.92) 100%)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        // Bordure subtile tout autour — pas de ligne blanche marquée
        border: '1px solid rgba(255,255,255,0.07)',
        // Reflet lumineux en haut de la card uniquement
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.4)',
      }}>

        {/* Shimmer iridescent — identique au header */}
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
                  {['T','G','D','Li'].map(s => (
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
                { title: 'Produit',    links: ['Canvas visuel','12 nœuds','IA Claude','Graphiques','Export','Templates','Changelog'] },
                { title: 'Solutions',  links: ['Finance','Logistique','E-commerce','RH','Data Science','Marketing','Opérations'] },
                { title: 'Ressources', links: ['Documentation','Guides','API Reference','Statut','Blog','Communauté'] },
                { title: 'Entreprise', links: ['À propos','Carrières','Contact','Presse','Partenaires','Légal'] },
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
                          onMouseOut={e  => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
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
                { title: 'Intégrations',   links: ['PostgreSQL','MySQL','MongoDB','Google Sheets','Snowflake','BigQuery'] },
                { title: 'Combinaisons',   links: ['CSV + IA Transform','SQL + Agrégation','JSON + Chart','API + Export'] },
                { title: 'Catégories',     links: ['Finance','Logistique','E-commerce','RH','Data Science'] },
                { title: 'Templates',      links: ['Réconciliation bancaire','Rapport KPIs','Analyse cohortes','OHADA'] },
                { title: 'Guides',         links: ['Premiers pas','Pipeline en 5 min','Nœud IA','Connecter une DB'] },
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
                          onMouseOut={e  => (e.currentTarget.style.color = 'rgba(255,255,255,0.16)')}
                        >{l}</span>
                      </li>
                    ))}
                    <li>
                      <span
                        className="text-xs cursor-pointer transition-colors"
                        style={{ color: 'rgba(255,109,53,0.32)' }}
                        onMouseOver={e => (e.currentTarget.style.color = '#ff6d35')}
                        onMouseOut={e  => (e.currentTarget.style.color = 'rgba(255,109,53,0.32)')}
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
              {['Conditions','Confidentialité','Cookies','Signaler une vulnérabilité'].map(l => (
                <span
                  key={l}
                  className="text-xs cursor-pointer transition-colors"
                  style={{ color: 'rgba(255,255,255,0.14)' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                  onMouseOut={e  => (e.currentTarget.style.color = 'rgba(255,255,255,0.14)')}
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
// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, isDemoMode } = useAuthStore()
  useEffect(() => { if (isAuthenticated && !isDemoMode) router.push('/dashboard') }, [isAuthenticated, isDemoMode, router])

  return (
    <div className="${poppins.variable} relative min-h-screen overflow-x-hidden text-gray-200" style={{
      background: '#0a0a0b',
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)',
      backgroundSize: '14px 14px',
      fontFamily:  "'Poppins', sans-serif",
    }}>
      <CursorGlow />

      {/* NAV */}
      {/* Spacer pour compenser le header fixed */}
        <div style={{ height: 72 }} />

        <header style={{
          position: 'fixed',
          top: 16,
          left: 24,
          right: 24,
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
              {[
                { label: 'Produit', href: '#features' },
                { label: 'Nœuds', href: '/noeuds' },
                { label: 'Tarifs', href: '/tarifs' },
                { label: 'Docs', href: '/docs' },
              ].map(item => (
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
      {/* HERO */}
      <section className="mx-auto max-w-5xl px-6 pt-28 pb-14 text-center relative z-10">
        <h1 className="mx-auto max-w-3xl text-5xl font-light leading-[1.1] tracking-tight text-white md:text-[64px]"
          style={{ animation: 'slide-up 0.7s cubic-bezier(0.16,1,0.3,1) both' }}>
          Transformez <Typewriter /><br />
          <span className="text-gray-400 font-light">en insights actionnables.</span>
        </h1>
        <p className="mx-auto mt-7 max-w-md text-base text-gray-500 leading-relaxed"
          style={{ animation: 'slide-up 0.7s cubic-bezier(0.16,1,0.3,1) 120ms both' }}>
          Pipelines de données visuels. Filtrez, joignez, transformez avec l&apos;IA. Sans écrire une ligne de code.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ animation: 'slide-up 0.7s cubic-bezier(0.16,1,0.3,1) 200ms both' }}>
          <Magnetic>
            <Link href="/register"
              className="group flex items-center gap-2 rounded-xl bg-[#ff6d35] px-7 py-3.5 text-base font-light text-white transition-all hover:bg-[#e85e2a] active:scale-95"
              style={{ boxShadow: '0 4px 28px rgba(255,109,53,0.3)' }}>
              Créer un pipeline gratuit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href="/demo"
              className="flex items-center gap-2 rounded-xl border px-7 py-3.5 text-base font-medium text-gray-400 transition-all hover:text-gray-100 hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <Play className="h-4 w-4" fill="currentColor" />
              Voir la démo
            </Link>
          </Magnetic>
        </div>
        <p className="mt-4 text-xs text-gray-700" style={{ animation: 'slide-up 0.7s cubic-bezier(0.16,1,0.3,1) 260ms both' }}>
          Gratuit · Sans carte · Prêt en 2 min
        </p>
      </section>

      {/* PRODUCT SCREENSHOT */}
      <Reveal className="relative z-10 mx-auto max-w-5xl px-6 pb-10">
        <div className="overflow-hidden rounded-2xl border" style={{
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 40px 120px rgba(0,0,0,0.8)',
        }}>
          <div className="flex items-center gap-2 border-b px-5 py-3" style={{ background: '#0e0e12', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#febc2e' }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#28c840' }} />
            <div className="mx-auto flex items-center gap-2 rounded-md px-4 py-1 text-[11px] text-gray-600" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              datapipe.io/editor/pipeline-abc123
            </div>
            <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 cursor-pointer transition-colors hover:bg-emerald-500/15"
              style={{ borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.08)' }}>
              <Play className="h-3 w-3 text-emerald-400" fill="currentColor" />
              <span className="text-[10px] text-emerald-400 font-semibold">Exécuter</span>
            </div>
          </div>
          <div className="flex" style={{ height: 282 }}>
            <div className="w-44 shrink-0 border-r p-3 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#0c0c10' }}>
              <p className="px-1 pb-2 text-[9px] font-bold uppercase tracking-widest text-gray-700">Nœuds</p>
              {[
                { label: 'CSV Import', c: '#00e5a0' }, { label: 'JSON Loader', c: '#00e5a0' },
                { label: 'Filtre', c: '#ff6d35' }, { label: 'Agrégation', c: '#ff6d35' },
                { label: 'IA Transform', c: '#ff6d35' }, { label: 'Chart', c: '#ff6d35' },
                { label: 'Export', c: '#ff6d35' },
              ].map(n => (
                <div key={n.label} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/4 cursor-pointer transition-colors group">
                  <div className="h-4 w-4 shrink-0 rounded-md flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{ background: n.c + '18', border: `1px solid ${n.c}28` }}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: n.c }} />
                  </div>
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors">{n.label}</span>
                </div>
              ))}
            </div>
            <HeroCanvas />
          </div>
        </div>
      </Reveal>

      {/* STATS */}
      <section className="relative z-10 border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0c0c10' }}>
        <div className="mx-auto grid max-w-5xl grid-cols-2 md:grid-cols-4">
          {[
            { value: 12,  suffix: '',  label: 'Types de nœuds' },
            { value: 100, suffix: '%', label: 'Sans code requis' },
            { value: 4,   suffix: '',  label: 'Types de graphiques' },
            { value: 1,   suffix: 's', label: 'Temps de run moyen' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center py-10 px-8 transition-colors hover:bg-white/2 cursor-default"
              style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span className="text-4xl font-medium text-white"><CountUp to={s.value} suffix={s.suffix} /></span>
              <span className="mt-1 text-xs text-gray-600 text-center">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="relative z-10">
        <BentoGrid />
        <AISection />
        <ActorsSection />
        <StickyFeatures />
        <NodesSection />
        <TestimonialsSection />
      </div>

      {/* CTA */}
      <section className="relative z-10 border-t py-28" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Reveal className="mx-auto max-w-xl px-6 text-center">
          <h2 className="text-4xl font-light text-white md:text-4xl leading-tight">
            Commencez maintenant.<br />
            <span style={{ color: '#ff6d35' }}>C&apos;est gratuit.</span>
          </h2>
          <p className="mt-5 text-base text-gray-500">Votre premier pipeline est à 2 minutes.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Link href="/register"
                className="group flex items-center gap-2 rounded-xl bg-[#ff6d35] px-8 py-4 text-base font-bold text-white transition-all hover:bg-[#e85e2a] active:scale-95"
                style={{ boxShadow: '0 4px 32px rgba(255,109,53,0.28)' }}>
                Créer mon compte gratuit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Magnetic>
            <Link href="/demo"
              className="flex items-center gap-2 rounded-xl border px-8 py-4 text-base font-medium text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              Voir la démo
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-7">
            {['Gratuit', 'Sans carte bancaire', 'Open pipeline'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-gray-700">
                <Check className="h-3 w-3 text-emerald-500/70" />{t}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      <div className="relative z-10"><Footer /></div>
    </div>
  )
}
