'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth.store'
import { login as loginRequest, getCurrentUser } from '@/lib/api/auth'
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
        background: 'radial-gradient(circle, rgba(255,109,53,0.06) 0%, transparent 65%)',
        transition: 'left 0.14s ease-out, top 0.14s ease-out',
        left: -300, top: -300,
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Pipeline canvas background
// ─────────────────────────────────────────────────────────────────────────
const PIPELINE_NODES = [
  { id: 0, x: 80,  y: 180, label: 'CSV Import',   color: '#10b981', shape: 'src' },
  { id: 1, x: 280, y: 180, label: 'Filtre',        color: '#3b82f6', shape: 'trx' },
  { id: 2, x: 480, y: 180, label: 'Join',          color: '#3b82f6', shape: 'trx' },
  { id: 3, x: 680, y: 180, label: 'IA Transform',  color: '#8b5cf6', shape: 'ai'  },
  { id: 4, x: 880, y: 180, label: 'Export',        color: '#f59e0b', shape: 'out' },
  // second row
  { id: 5, x: 180, y: 380, label: 'JSON Loader',   color: '#10b981', shape: 'src' },
  { id: 6, x: 380, y: 380, label: 'Nettoyage',     color: '#3b82f6', shape: 'trx' },
  { id: 7, x: 580, y: 380, label: 'Agrégation',    color: '#3b82f6', shape: 'trx' },
  { id: 8, x: 780, y: 380, label: 'Chart',         color: '#f59e0b', shape: 'out' },
]

const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8],
]

function PipelineCanvas() {
  const [activeNode, setActiveNode] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode(prev => {
        const next = (prev + 1) % PIPELINE_NODES.length
        return next
      })
      setProgress(0)
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const tick = setInterval(() => {
      setProgress(p => Math.min(p + 4, 100))
    }, 20)
    return () => clearInterval(tick)
  }, [activeNode])

  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{ opacity: 0.22 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Edges */}
      {EDGES.map(([from, to], i) => {
        const a = PIPELINE_NODES[from]
        const b = PIPELINE_NODES[to]
        const isActive = activeNode === from || activeNode === to
        return (
          <g key={i}>
            <line
              x1={a.x + 36} y1={a.y + 22}
              x2={b.x}       y2={b.y + 22}
              stroke={isActive ? a.color : 'rgba(255,255,255,0.08)'}
              strokeWidth={isActive ? 1.5 : 1}
              strokeDasharray={isActive ? 'none' : '5 4'}
              style={{ transition: 'stroke 0.4s ease' }}
            />
            {/* Animated dot on active edge */}
            {isActive && (
              <circle r="3" fill={a.color} style={{ opacity: 0.9 }}>
                <animateMotion
                  dur="1.4s"
                  repeatCount="indefinite"
                  path={`M${a.x + 36},${a.y + 22} L${b.x},${b.y + 22}`}
                />
              </circle>
            )}
          </g>
        )
      })}

      {/* Nodes */}
      {PIPELINE_NODES.map((node) => {
        const isActive = activeNode === node.id
        const isDone   = activeNode > node.id
        const color    = node.color

        // shape
        const w = 90, h = 44
        const rx = node.shape === 'src' ? 16
                 : node.shape === 'ai'  ? 22
                 : node.shape === 'out' ? 8
                 : 12

        return (
          <g key={node.id} style={{ transition: 'opacity 0.3s' }}>
            {/* Glow when active */}
            {isActive && (
              <rect
                x={node.x - 4} y={node.y - 4}
                width={w + 8} height={h + 8}
                rx={rx + 4}
                fill="none"
                stroke={color}
                strokeWidth={1}
                opacity={0.3}
              >
                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1s" repeatCount="indefinite" />
              </rect>
            )}

            {/* Box */}
            <rect
              x={node.x} y={node.y}
              width={w} height={h}
              rx={rx}
              fill={isDone || isActive ? `${color}18` : 'rgba(255,255,255,0.03)'}
              stroke={isDone || isActive ? `${color}60` : 'rgba(255,255,255,0.08)'}
              strokeWidth={isActive ? 1.5 : 1}
              style={{ transition: 'all 0.4s ease' }}
            />

            {/* Top stripe */}
            <rect
              x={node.x} y={node.y}
              width={w} height={2.5}
              rx={rx}
              fill={isDone || isActive ? color : 'rgba(255,255,255,0.06)'}
              opacity={isDone || isActive ? 0.8 : 1}
              style={{ transition: 'fill 0.4s ease' }}
            />

            {/* Status dot */}
            <circle
              cx={node.x + w - 10} cy={node.y + 10} r={3.5}
              fill={isDone ? '#10b981' : isActive ? color : 'rgba(255,255,255,0.1)'}
              style={{ transition: 'fill 0.4s ease' }}
            >
              {isActive && (
                <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />
              )}
            </circle>

            {/* Label */}
            <text
              x={node.x + 10} y={node.y + 27}
              fontSize={10}
              fontFamily="monospace"
              fill={isDone || isActive ? color : 'rgba(255,255,255,0.2)'}
              style={{ transition: 'fill 0.4s ease' }}
            >
              {node.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Login Page
// ─────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router   = useRouter()
  const { setUser } = useAuthStore()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setIsLoading(true)
    try {
      await loginRequest(email, password)
      const user = await getCurrentUser()
      setUser(user)
      router.push('/dashboard')
    } catch {
      toast.error('Identifiants incorrects')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={poppins.className}
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: '#08080c',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <CursorGlow />

      {/* Ambient orange orb top-left */}
      <div className="pointer-events-none absolute -top-60 -left-60 h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,109,53,0.08) 0%, transparent 65%)' }} />
      {/* Ambient violet orb bottom-right */}
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)' }} />

      {/* Pipeline canvas — plein écran, en fond */}
      <PipelineCanvas />

      {/* ── CARD LIQUID GLASS ────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 420,
          margin: '0 24px',
          borderRadius: 20,
          overflow: 'hidden',
          // Liquid glass
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(12,12,18,0.82) 35%, rgba(8,8,12,0.95) 100%)',
          backdropFilter: 'blur(32px) saturate(160%)',
          WebkitBackdropFilter: 'blur(32px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 40px 100px rgba(0,0,0,0.6)',
          // Entrée
          opacity:   mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Shimmer iridescent */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'linear-gradient(135deg, rgba(255,109,53,0.04) 0%, transparent 40%, rgba(139,92,246,0.03) 100%)',
        }} />

        {/* Contenu */}
        <div style={{ position: 'relative', zIndex: 1, padding: '36px 36px 32px' }}>

          {/* Logo */}
          <div style={{ marginBottom: 32 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <Image src="/logo.png" alt="DataPipe" width={52} height={52} style={{ borderRadius: 9 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.2px' }}>DataPipe</span>
            </Link>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight:200 , color: '#f5f5f5', letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: 6 }}>
              Content de vous revoir
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', lineHeight: 1.5 }}>
              Pas encore de compte ?{' '}
              <Link href="/register" style={{ color: '#ff6d35', textDecoration: 'none' }}
                onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={e  => (e.currentTarget.style.textDecoration = 'none')}>
                Créer un compte
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px' }}>
                Adresse email
              </label>
              <input
                type="email"
                placeholder="vous@acme.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                style={{
                  height: 42,
                  padding: '0 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 10,
                  color: '#f0f0f0',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#ff6d35'
                  e.currentTarget.style.background   = 'rgba(255,109,53,0.04)'
                  e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(255,109,53,0.12)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
                  e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.boxShadow    = 'none'
                }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px' }}>
                  Mot de passe
                </label>
                <Link href="/forgot-password" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#ff6d35')}
                  onMouseOut={e  => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                  Oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 40px 0 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 10,
                    color: '#f0f0f0',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#ff6d35'
                    e.currentTarget.style.background   = 'rgba(255,109,53,0.04)'
                    e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(255,109,53,0.12)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
                    e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.boxShadow    = 'none'
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: 'rgba(255,255,255,0.25)', transition: 'color 0.15s',
                    display: 'flex', alignItems: 'center',
                  }}
                  onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  onMouseOut={e  => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                >
                  {showPwd ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 4,
                height: 44,
                width: '100%',
                background: isLoading ? 'rgba(255,109,53,0.5)' : '#ff6d35',
                border: 'none',
                borderRadius: 11,
                color: '#fff',
                fontSize: 14,
                fontWeight: 200,
                fontFamily: 'inherit',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isLoading ? 'none' : '0 4px 24px rgba(255,109,53,0.28)',
                transition: 'background 0.15s, box-shadow 0.15s, transform 0.1s',
                letterSpacing: '-0.1px',
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
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Connexion…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Google */}
          <button
            type="button"
            style={{
              width: '100%', height: 42,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              color: 'rgba(255,255,255,0.45)',
              fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background    = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.14)'
              e.currentTarget.style.color         = 'rgba(255,255,255,0.7)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.background    = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color         = 'rgba(255,255,255,0.45)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuer avec Google
          </button>

        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  )
}