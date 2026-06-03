'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { MarketingShell, PageHero } from '@/components/marketing/MarketingShell'
import { NODE_REGISTRY, CATEGORY_ORDER, type NodeDef } from '@/lib/nodeRegistry'

const CATEGORY_DESC: Record<string, string> = {
  Input: 'Faites entrer vos données — fichiers, bases, APIs.',
  Transform: 'Nettoyez, filtrez, joignez et agrégez sans code.',
  AI: 'Laissez l\'IA transformer vos données en langage naturel.',
  Output: 'Écrivez le résultat où vous voulez.',
  Control: 'Orchestrez le flux entre plusieurs branches.',
  Trigger: 'Déclenchez vos pipelines automatiquement.',
  Visualisation: 'Visualisez le résultat directement dans l\'éditeur.',
}

// Explications lisibles (le « à quoi ça sert »), pas les paramètres techniques.
const NODE_EXPLAIN: Record<string, string> = {
  csv_reader: "Charge un fichier CSV de votre workspace et le transforme en tableau exploitable. C'est le point de départ le plus courant d'un pipeline : vos exports comptables, ventes ou clients deviennent manipulables en un clic.",
  json_reader: "Lit un fichier JSON et en extrait les données, même profondément imbriquées. Parfait pour récupérer les exports d'applications ou de services web et les aplatir en lignes.",
  sql_query: "Interroge directement une base de données connectée avec une vraie requête SQL, et récupère le résultat comme source du pipeline. Idéal quand vos données vivent déjà dans une base.",
  http_request: "Va chercher des données depuis une API web (REST). Permet de brancher des services externes — taux de change, paiements, CRM — et de les intégrer en temps réel à votre flux.",
  filter: "Ne garde que les lignes qui respectent vos conditions, comme un WHERE en SQL mais en visuel. Par exemple : ne conserver que les transactions supérieures à 500 ou les clients actifs.",
  map: "Renomme, crée ou recalcule des colonnes. Sert à remettre vos données au bon format : harmoniser des noms de colonnes, concaténer des champs, convertir des unités.",
  aggregate: "Regroupe les lignes et calcule des totaux, moyennes, comptes ou maximums. C'est l'outil pour résumer de gros volumes : chiffre d'affaires par région, nombre de commandes par mois…",
  join: "Combine deux sources sur une clé commune, exactement comme un JOIN SQL. Sert à croiser des données : associer chaque commande à son client, chaque transaction à son compte.",
  sort: "Ordonne les lignes selon une ou plusieurs colonnes, en ordre croissant ou décroissant. Utile pour classer un top, préparer un rapport ou trier par date.",
  dedup: "Supprime les lignes en double en se basant sur les colonnes clés que vous choisissez. Indispensable pour nettoyer des exports qui contiennent des doublons.",
  sql_transform: "Applique une transformation SQL complète sur les données déjà dans le pipeline. Toute la puissance de SQL (sous-requêtes, fenêtrage…) pour les cas avancés.",
  validate: "Contrôle que vos données respectent des règles (type, présence obligatoire) et sépare automatiquement les lignes valides des lignes en erreur, sur deux sorties distinctes.",
  ai_transform: "Décrivez en français la transformation souhaitée : l'IA génère le code, l'applique et vous montre le résultat. Idéal pour les cas complexes sans écrire une ligne de code.",
  sql_write: "Écrit le résultat du pipeline dans une table de base de données — en insertion, mise à jour ou remplacement. Pour alimenter vos systèmes existants automatiquement.",
  file_export: "Exporte les données finales dans un fichier téléchargeable : CSV, JSON, Excel ou Parquet. La sortie la plus simple pour livrer un rapport.",
  webhook_send: "Envoie les données vers une URL externe. Sert à déclencher d'autres systèmes — un Slack, un outil interne, une autre automatisation — dès que le pipeline produit un résultat.",
  notification_send: "Prévient les bonnes personnes à la fin du traitement, par email, Slack ou SMS. Pour être alerté qu'un rapport est prêt ou qu'une anomalie a été détectée.",
  merge: "Réunit plusieurs flux en un seul. Quand votre pipeline s'est divisé en branches, ce nœud les rassemble pour la suite du traitement.",
  split: "Divise un flux en plusieurs sorties selon une stratégie (copie, condition, répartition). Pour traiter différemment des sous-ensembles de vos données.",
  schedule_trigger: "Lance le pipeline tout seul, selon un planning cron. Pour automatiser un rapport quotidien, une synchronisation horaire ou un traitement mensuel.",
  table_preview: "Affiche le résultat sous forme de tableau paginé directement dans l'éditeur. Pour vérifier d'un coup d'œil que la transformation produit ce que vous attendez.",
  chart: "Génère un graphique — barres, lignes, camembert ou aires — à partir de vos données. Pour visualiser une tendance ou une répartition sans quitter l'éditeur.",
}

function NodeCard({ node }: { node: NodeDef }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-xl transition-colors"
      style={{
        background: open ? 'rgba(255,109,53,0.05)' : '#0f0f13',
        border: `1px solid ${open ? 'rgba(255,109,53,0.3)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2.5 p-4 text-left">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6d35]" />
        <p className="text-sm font-semibold text-gray-200">{node.label}</p>
        <span className="ml-auto text-[10px] text-gray-700 font-mono">{node.inputs}→{node.outputs}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-gray-600 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div className="px-4 pb-4" style={{ animation: 'slide-up 0.25s ease' }}>
          <p className="text-xs text-gray-400 leading-relaxed">
            {NODE_EXPLAIN[node.slug] ?? node.description}
          </p>
        </div>
      )}
    </div>
  )
}

export default function NoeudsPage() {
  const grouped = CATEGORY_ORDER
    .map((cat) => ({ cat, nodes: NODE_REGISTRY.filter((n) => n.category === cat) }))
    .filter((g) => g.nodes.length > 0)

  return (
    <MarketingShell>
      <PageHero
        tag="Catalogue"
        title="22 nœuds pour tout faire."
        subtitle="Cliquez sur un nœud pour voir son rôle et sa configuration."
      />

      <div className="mx-auto max-w-5xl px-6 pb-24 space-y-12">
        {grouped.map(({ cat, nodes }) => (
          <section key={cat}>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-white">{cat}</h2>
              <p className="mt-1 text-sm text-gray-500">{CATEGORY_DESC[cat]}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
              {nodes.map((n) => <NodeCard key={n.slug} node={n} />)}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ background: '#0f0f13', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-2xl font-light text-white">Prêt à les assembler ?</h3>
          <p className="mt-2 text-sm text-gray-500">Construisez votre premier pipeline en 2 minutes.</p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ff6d35] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#e85e2a] active:scale-95"
            style={{ boxShadow: '0 4px 20px rgba(255,109,53,0.3)' }}
          >
            Créer un pipeline gratuit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingShell>
  )
}
