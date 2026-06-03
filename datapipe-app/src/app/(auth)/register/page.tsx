'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import Image from 'next/image'
import { register as registerRequest } from '@/lib/api/auth'
import { toast } from 'sonner'
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

// ─────────────────────────────────────────────────────────────────────────
// Cursor glow
// ─────────────────────────────────────────────────────────────────────────
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!ref.current) return
      ref.current.style.left = `${e.clientX - 300}px`
      ref.current.style.top  = `${e.clientY - 300}px`
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-0 h-[600px] w-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 65%)',
        transition: 'left 0.14s ease-out, top 0.14s ease-out',
        left: -300, top: -300,
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Pipeline canvas — même système que login
// ─────────────────────────────────────────────────────────────────────────
const PIPELINE_NODES = [
  { id: 0, x: 60,  y: 140, label: 'JSON Loader',  color: '#10b981', shape: 'src' },
  { id: 1, x: 240, y: 140, label: 'Nettoyage',    color: '#3b82f6', shape: 'trx' },
  { id: 2, x: 420, y: 140, label: 'Agrégation',   color: '#3b82f6', shape: 'trx' },
  { id: 3, x: 600, y: 140, label: 'IA Transform', color: '#8b5cf6', shape: 'ai'  },
  { id: 4, x: 800, y: 140, label: 'Chart',        color: '#f59e0b', shape: 'out' },
  { id: 5, x: 120, y: 340, label: 'CSV Import',   color: '#10b981', shape: 'src' },
  { id: 6, x: 300, y: 340, label: 'Filtre',       color: '#3b82f6', shape: 'trx' },
  { id: 7, x: 480, y: 340, label: 'Join',         color: '#3b82f6', shape: 'trx' },
  { id: 8, x: 680, y: 340, label: 'Export',       color: '#f59e0b', shape: 'out' },
]
const EDGES = [[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8]]

function PipelineCanvas() {
  const [activeNode, setActiveNode] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActiveNode(p => (p + 1) % PIPELINE_NODES.length), 1400)
    return () => clearInterval(t)
  }, [])

  return (
    <svg className="pointer-events-none absolute inset-0 w-full h-full" style={{ opacity: 0.2 }}>
      {EDGES.map(([from, to], i) => {
        const a = PIPELINE_NODES[from], b = PIPELINE_NODES[to]
        const active = activeNode === from || activeNode === to
        return (
          <g key={i}>
            <line
              x1={a.x + 88} y1={a.y + 22} x2={b.x} y2={b.y + 22}
              stroke={active ? a.color : 'rgba(255,255,255,0.07)'}
              strokeWidth={active ? 1.5 : 1}
              strokeDasharray={active ? 'none' : '5 4'}
              style={{ transition: 'stroke 0.4s' }}
            />
            {active && (
              <circle r="3" fill={a.color}>
                <animateMotion dur="1.4s" repeatCount="indefinite"
                  path={`M${a.x + 88},${a.y + 22} L${b.x},${b.y + 22}`} />
              </circle>
            )}
          </g>
        )
      })}
      {PIPELINE_NODES.map(node => {
        const isActive = activeNode === node.id
        const isDone   = activeNode > node.id
        const c = node.color
        const rx = node.shape === 'src' ? 16 : node.shape === 'ai' ? 22 : node.shape === 'out' ? 8 : 12
        return (
          <g key={node.id}>
            {isActive && (
              <rect x={node.x - 4} y={node.y - 4} width={96} height={52} rx={rx + 4}
                fill="none" stroke={c} strokeWidth={1} opacity={0.3}>
                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1s" repeatCount="indefinite" />
              </rect>
            )}
            <rect x={node.x} y={node.y} width={88} height={44} rx={rx}
              fill={isDone || isActive ? `${c}18` : 'rgba(255,255,255,0.03)'}
              stroke={isDone || isActive ? `${c}55` : 'rgba(255,255,255,0.07)'}
              strokeWidth={isActive ? 1.5 : 1}
              style={{ transition: 'all 0.4s' }} />
            <rect x={node.x} y={node.y} width={88} height={2.5} rx={rx}
              fill={isDone || isActive ? c : 'rgba(255,255,255,0.05)'}
              opacity={isDone || isActive ? 0.8 : 1}
              style={{ transition: 'fill 0.4s' }} />
            <circle cx={node.x + 78} cy={node.y + 10} r={3.5}
              fill={isDone ? '#10b981' : isActive ? c : 'rgba(255,255,255,0.1)'}
              style={{ transition: 'fill 0.4s' }}>
              {isActive && <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />}
            </circle>
            <text x={node.x + 8} y={node.y + 27} fontSize={9.5} fontFamily="monospace"
              fill={isDone || isActive ? c : 'rgba(255,255,255,0.18)'}
              style={{ transition: 'fill 0.4s' }}>
              {node.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Input style helpers
// ─────────────────────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10, color: '#f0f0f0',
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
}
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#ff6d35'
  e.currentTarget.style.background   = 'rgba(255,109,53,0.04)'
  e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(255,109,53,0.12)'
}
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
  e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
  e.currentTarget.style.boxShadow    = 'none'
}

// ─────────────────────────────────────────────────────────────────────────
// Register Page
// ─────────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', org_name: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep]       = useState<'form' | 'success'>('form')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Minimum 8 caractères'); return }
    setIsLoading(true)
    try {
      await registerRequest(form)
      setStep('success')
    } catch {
      toast.error("Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  // ── card glass style ────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    position: 'relative', zIndex: 10,
    width: '100%', maxWidth: 440,
    margin: '0 24px',
    borderRadius: 20, overflow: 'hidden',
    background: 'linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(12,12,18,0.82) 35%, rgba(8,8,12,0.95) 100%)',
    backdropFilter: 'blur(32px) saturate(160%)',
    WebkitBackdropFilter: 'blur(32px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 40px 100px rgba(0,0,0,0.6)',
    opacity:   mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)',
  }

  return (
    <div
      className={poppins.className}
      style={{
        position: 'relative', minHeight: '100vh',
        background: '#08080c',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <CursorGlow />

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -top-60 -right-60 h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 65%)' }} />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,109,53,0.06) 0%, transparent 65%)' }} />

      <PipelineCanvas />

      {/* ── CARD ───────────────────────────────────────────────────────── */}
      <div style={cardStyle}>

        {/* Shimmer */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'linear-gradient(135deg, rgba(168,85,247,0.04) 0%, transparent 40%, rgba(255,109,53,0.03) 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '36px 36px 32px' }}>

          {step === 'success' ? (
            /* ── Success ─────────────────────────────────────────────── */
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 24px rgba(16,185,129,0.15)',
              }}>
                <Check style={{ width: 28, height: 28, color: '#10b981' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f5f5f5', letterSpacing: '-0.4px', marginBottom: 8 }}>
                  Compte créé !
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                  Vérifiez votre boîte mail pour confirmer<br />votre adresse, puis connectez-vous.
                </p>
              </div>
              <Link href="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#ff6d35', color: '#fff',
                padding: '12px 24px', borderRadius: 11,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(255,109,53,0.28)',
                transition: 'background 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = '#e85e2a')}
                onMouseOut={e  => (e.currentTarget.style.background = '#ff6d35')}
              >
                Se connecter <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
            </div>

          ) : (
            /* ── Form ────────────────────────────────────────────────── */
            <>
              {/* Logo */}
              <div style={{ marginBottom: 28 }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <Image src="/logo.png" alt="DataPipe" width={52} height={52} style={{ borderRadius: 9 }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.2px' }}>DataPipe</span>
                </Link>
              </div>

              {/* Heading */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 200, color: '#f5f5f5', letterSpacing: '-0.5px', marginBottom: 6 }}>
                  Créer un compte
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)' }}>
                  Déjà inscrit ?{' '}
                  <Link href="/login" style={{ color: '#ff6d35', textDecoration: 'none' }}
                    onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseOut={e  => (e.currentTarget.style.textDecoration = 'none')}>
                    Se connecter
                  </Link>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Nom */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px' }}>
                    Nom complet
                  </label>
                  <input
                    placeholder="John Doe" value={form.name}
                    onChange={update('name')} required autoFocus
                    style={inputBase} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px' }}>
                    Adresse email
                  </label>
                  <input
                    type="email" placeholder="john@acme.com" value={form.email}
                    onChange={update('email')} required autoComplete="email"
                    style={inputBase} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                {/* Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px' }}>
                    Mot de passe
                  </label>
                  <input
                    type="password" placeholder="Min. 8 caractères" value={form.password}
                    onChange={update('password')} required autoComplete="new-password"
                    style={inputBase} onFocus={onFocus} onBlur={onBlur}
                  />
                  {form.password.length > 0 && form.password.length < 8 && (
                    <p style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                      Encore {8 - form.password.length} caractère{8 - form.password.length > 1 ? 's' : ''}
                    </p>
                  )}
                  {/* Password strength bar */}
                  {form.password.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 2.5, borderRadius: 99,
                          background: form.password.length >= i * 2
                            ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#3b82f6' : '#10b981'
                            : 'rgba(255,255,255,0.08)',
                          transition: 'background 0.2s',
                        }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Organisation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px', display: 'flex', gap: 6 }}>
                    Organisation
                    <span style={{ color: 'rgba(255,255,255,0.18)', fontWeight: 400 }}>optionnel</span>
                  </label>
                  <input
                    placeholder="Acme Corp" value={form.org_name}
                    onChange={update('org_name')}
                    style={inputBase} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit" disabled={isLoading}
                  style={{
                    marginTop: 6, height: 44, width: '100%',
                    background: isLoading ? 'rgba(255,109,53,0.5)' : '#ff6d35',
                    border: 'none', borderRadius: 11,
                    color: '#fff', fontSize: 14, fontWeight: 200, fontFamily: 'inherit',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: isLoading ? 'none' : '0 4px 24px rgba(255,109,53,0.28)',
                    transition: 'background 0.15s, transform 0.1s',
                  }}
                  onMouseOver={e => { if (!isLoading) e.currentTarget.style.background = '#e85e2a' }}
                  onMouseOut={e  => { if (!isLoading) e.currentTarget.style.background = '#ff6d35' }}
                  onMouseDown={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.98)' }}
                  onMouseUp={e   => { if (!isLoading) e.currentTarget.style.transform = 'scale(1)' }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      Création…
                    </>
                  ) : (
                    <>Créer mon compte <ArrowRight style={{ width: 15, height: 15 }} /></>
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}>
                  En créant un compte vous acceptez nos{' '}
                  <span style={{ color: 'rgba(255,255,255,0.32)', cursor: 'pointer' }}>Conditions d'utilisation</span>
                  {' '}et notre{' '}
                  <span style={{ color: 'rgba(255,255,255,0.32)', cursor: 'pointer' }}>Politique de confidentialité</span>.
                </p>
              </form>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}