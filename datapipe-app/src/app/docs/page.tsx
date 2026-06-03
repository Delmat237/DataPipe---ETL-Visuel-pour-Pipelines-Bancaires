'use client'

import Link from 'next/link'
import { Rocket, Boxes, Sparkles, Webhook, Play, Code2, ArrowRight } from 'lucide-react'
import { MarketingShell, PageHero } from '@/components/marketing/MarketingShell'

const SECTIONS = [
  {
    icon: Rocket,
    title: 'Démarrage rapide',
    desc: 'Créez un compte, lancez un pipeline en 2 minutes.',
    items: ['Créer son premier pipeline', 'Importer un fichier CSV', 'Lancer une exécution', 'Lire les résultats'],
  },
  {
    icon: Boxes,
    title: 'Les nœuds',
    desc: 'Référence des 22 nœuds et de leur configuration.',
    items: ['Nœuds d\'entrée (CSV, JSON, SQL, HTTP)', 'Transformations (Filter, Join, Aggregate…)', 'Sorties (Export, Webhook, SQL Write)', 'Contrôle de flux (Merge, Split)'],
  },
  {
    icon: Sparkles,
    title: 'IA Transform',
    desc: 'Transformez vos données en langage naturel.',
    items: ['Écrire une bonne instruction', 'Choisir le modèle', 'Vérifier le code généré', 'Bonnes pratiques'],
  },
  {
    icon: Webhook,
    title: 'Webhooks & API',
    desc: 'Connectez DataPipe à votre stack.',
    items: ['Créer une clé API', 'Déclencher via webhook', 'Recevoir les événements', 'Authentification'],
  },
  {
    icon: Play,
    title: 'Exécutions & planification',
    desc: 'Lancez manuellement ou via cron.',
    items: ['Exécution manuelle', 'Planification cron', 'Suivi en temps réel', 'Logs & erreurs'],
  },
  {
    icon: Code2,
    title: 'Référence API',
    desc: 'Endpoints REST pour automatiser.',
    items: ['Pipelines', 'Nœuds & arêtes', 'Runs', 'Fichiers & datasources'],
  },
]

export default function DocsPage() {
  return (
    <MarketingShell>
      <PageHero
        tag="Documentation"
        title="Tout pour bien démarrer."
        subtitle="Guides, référence des nœuds et API — de la première importation à l'automatisation complète."
      />

      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl p-5 transition-colors hover:border-white/15"
              style={{ background: '#0f0f13', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(255,109,53,0.12)', border: '1px solid rgba(255,109,53,0.2)' }}>
                <s.icon className="h-4 w-4 text-[#ff6d35]" />
              </div>
              <h3 className="text-sm font-bold text-white">{s.title}</h3>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              <ul className="mt-4 space-y-1.5">
                {s.items.map((it) => (
                  <li key={it} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">
                    <span className="h-1 w-1 rounded-full bg-gray-700" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Quickstart code */}
        <div className="mt-10 rounded-2xl overflow-hidden" style={{ background: '#0a0a0e', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1.5 border-b px-4 py-2.5" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="h-2 w-2 rounded-full bg-red-500/60" />
            <span className="h-2 w-2 rounded-full bg-amber-500/60" />
            <span className="h-2 w-2 rounded-full bg-emerald-500/60" />
            <span className="ml-2 text-[10px] font-mono text-gray-600">exécuter un pipeline via l&apos;API</span>
          </div>
          <pre className="p-4 text-[11px] leading-relaxed font-mono text-gray-400 overflow-x-auto">{`curl -X POST https://api.datapipe.io/v1/pipelines/PIP_ID/runs \\
  -H "Authorization: Bearer $DATAPIPE_API_KEY" \\
  -H "Content-Type: application/json"

# → { "run_id": "run_a3b2", "status": "queued" }`}</pre>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#ff6d35] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#e85e2a] active:scale-95"
            style={{ boxShadow: '0 4px 20px rgba(255,109,53,0.3)' }}
          >
            Commencer maintenant <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingShell>
  )
}
