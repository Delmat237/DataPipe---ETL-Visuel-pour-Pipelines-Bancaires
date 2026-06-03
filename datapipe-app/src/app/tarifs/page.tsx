'use client'

import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { MarketingShell, PageHero } from '@/components/marketing/MarketingShell'
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
})


const PLANS = [
  {
    name: 'Free',
    price: '0 FCFA',
    period: '/mois',
    desc: 'Pour découvrir et les petits projets.',
    cta: 'Commencer gratuitement',
    href: '/register',
    highlighted: false,
    features: ['3 pipelines', '1 000 exécutions/mois', '22 nœuds disponibles', 'IA Transform (limité)', 'Export CSV & JSON'],
  },
  {
    name: 'Pro',
    price: '19 000 FCFA',
    period: '/mois',
    desc: 'Pour les équipes qui automatisent au quotidien.',
    cta: 'Démarrer l\'essai',
    href: '/register',
    highlighted: true,
    features: ['Pipelines illimités', '50 000 exécutions/mois', 'IA Transform illimité', 'Planifications cron', 'Webhooks & API', 'Support prioritaire'],
  },
  {
    name: 'Entreprise',
    price: 'Sur devis',
    period: '',
    desc: 'Sécurité, volume et accompagnement.',
    cta: 'Nous contacter',
    href: '/register',
    highlighted: false,
    features: ['Exécutions illimitées', 'SSO & rôles avancés', 'Datasources dédiées', 'SLA garanti', 'Onboarding sur mesure'],
  },
]

export default function TarifsPage() {
  return (
    <MarketingShell>
      <PageHero
        tag="Tarifs"
        title="Un prix simple, sans surprise."
        subtitle="Commencez gratuitement, passez à l'échelle quand vous êtes prêt."
      />

      <div className="${poppins.variable} mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="relative font-light flex flex-col rounded-2xl p-6"
              style={{
                background: plan.highlighted ? 'rgba(255,109,53,0.06)' : '#0f0f13',
                border: `1px solid ${plan.highlighted ? 'rgba(255,109,53,0.35)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {plan.highlighted && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-[#ff6d35] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Populaire
                </span>
              )}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed min-h-[2.5em]">{plan.desc}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-light text-white">{plan.price}</span>
                <span className="text-sm text-gray-600">{plan.period}</span>
              </div>

              <ul className="mt-6 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6d35]" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="mt-7 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all active:scale-95"
                style={
                  plan.highlighted
                    ? { background: '#ff6d35', color: '#fff', boxShadow: '0 4px 20px rgba(255,109,53,0.3)' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#e5e5e5', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {plan.cta}
                {plan.highlighted && <ArrowRight className="h-4 w-4" />}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-gray-700">
          Tous les plans incluent les 22 nœuds et le mode démo. Annulable à tout moment.
        </p>
      </div>
    </MarketingShell>
  )
}
