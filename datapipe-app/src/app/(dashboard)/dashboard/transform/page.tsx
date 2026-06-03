'use client'

import { useEffect, useState } from 'react'
import { Play, CheckCircle2, Eye, Sparkles, FlaskConical, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  transformApi, type SqlResult, type SqlTemplate, type SqlFunction, type SqlHistoryEntry,
} from '@/lib/api/transform'
import { toast } from 'sonner'

export default function TransformPage() {
  const [query, setQuery] = useState('SELECT * FROM data LIMIT 100;')
  const [result, setResult] = useState<SqlResult | null>(null)
  const [running, setRunning] = useState(false)
  const [sample, setSample] = useState<Record<string, unknown>[] | null>(null)
  const [mockCount, setMockCount] = useState(10)

  const [templates, setTemplates] = useState<SqlTemplate[]>([])
  const [functions, setFunctions] = useState<SqlFunction[]>([])
  const [history, setHistory] = useState<SqlHistoryEntry[]>([])

  useEffect(() => {
    transformApi.getTemplates().then(setTemplates).catch(() => {})
    transformApi.getFunctions().then(setFunctions).catch(() => {})
    transformApi.getHistory().then(setHistory).catch(() => {})
  }, [])

  const refreshHistory = () => transformApi.getHistory().then(setHistory).catch(() => {})

  const handleValidate = async () => {
    try {
      const r = await transformApi.validate(query)
      r.valid ? toast.success(r.message ?? 'Requête valide') : toast.error(r.message ?? 'Requête invalide')
    } catch { toast.error('Validation impossible') }
  }

  const handleRun = async () => {
    setRunning(true)
    try {
      const r = sample ? await transformApi.preview(query, sample) : await transformApi.execute(query)
      setResult(r)
      if (r.error) toast.error(r.error)
      else { toast.success(`${r.rows.length} ligne(s)`); refreshHistory() }
    } catch { toast.error('Exécution impossible') } finally { setRunning(false) }
  }

  const handleMock = async () => {
    try {
      const r = await transformApi.generateMockData(mockCount)
      setSample(r.rows)
      setResult(r)
      toast.success(`${r.rows.length} lignes fictives générées (mode aperçu)`)
    } catch { toast.error('Génération impossible') }
  }

  const handleChain = async () => {
    const steps = query.split(';').map((s) => s.trim()).filter(Boolean)
    if (steps.length < 2) { toast.info('Séparez au moins deux requêtes par « ; » pour chaîner'); return }
    setRunning(true)
    try {
      const r = await transformApi.chain(steps.map((q) => ({ type: 'sql', query: q })))
      setResult(null)
      toast.success('Chaîne exécutée')
      console.info('chain result', r)
    } catch { toast.error('Chaîne impossible') } finally { setRunning(false) }
  }

  const applyTemplate = async (t: SqlTemplate) => {
    if (t.query) { setQuery(t.query); return }
    try {
      const r = await transformApi.applyTemplate(t.id)
      if (r.query) { setQuery(r.query); toast.success(`Template « ${t.name} » appliqué`) }
    } catch { toast.error('Template indisponible') }
  }

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Transformations SQL</h1>
          <p className="text-sm text-gray-500">Écrivez, validez et exécutez des requêtes sur vos données</p>
        </div>
        {sample && <Badge variant="warning" className="h-6">Échantillon : {sample.length} lignes</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Éditeur */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="p-3">
            <Textarea
              className="font-mono text-sm h-48 resize-none border-0 focus-visible:ring-0 bg-transparent"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
            />
          </Card>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleRun} disabled={running} className="gap-2">
              {sample ? <Eye className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? 'Exécution…' : sample ? 'Aperçu' : 'Exécuter'}
            </Button>
            <Button variant="outline" onClick={handleValidate} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Valider
            </Button>
            <Button variant="outline" onClick={handleChain} className="gap-2">
              <Workflow className="h-4 w-4" /> Chaîner
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Input type="number" min={1} max={1000} value={mockCount} onChange={(e) => setMockCount(Number(e.target.value))} className="w-20 h-9" />
              <Button variant="outline" onClick={handleMock} className="gap-2">
                <FlaskConical className="h-4 w-4" /> Données fictives
              </Button>
            </div>
          </div>

          {/* Résultats */}
          {result && (
            <Card className="p-0 overflow-hidden">
              {result.error ? (
                <p className="p-4 text-sm text-red-400 font-mono">{result.error}</p>
              ) : result.rows.length === 0 ? (
                <p className="p-4 text-sm text-gray-600">Aucune ligne</p>
              ) : (
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card">
                      <tr>{result.columns.map((c) => <th key={c} className="px-3 py-2 text-left font-semibold text-gray-400 whitespace-nowrap">{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          {result.columns.map((c) => <td key={c} className="px-3 py-1.5 text-gray-300 whitespace-nowrap">{fmt(row[c])}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Panneau latéral */}
        <Card className="p-3">
          <Tabs defaultValue="templates">
            <TabsList className="w-full">
              <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
              <TabsTrigger value="functions" className="flex-1">Fonctions</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-1.5 max-h-96 overflow-auto">
              {templates.length === 0 ? <Empty label="Aucun template" /> : templates.map((t) => (
                <button key={t.id} onClick={() => applyTemplate(t)} className="w-full rounded-lg border border-border px-3 py-2 text-left hover:bg-card transition-colors">
                  <p className="text-sm text-foreground flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> {t.name}</p>
                  {t.description && <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{t.description}</p>}
                </button>
              ))}
            </TabsContent>

            <TabsContent value="functions" className="space-y-1 max-h-96 overflow-auto">
              {functions.length === 0 ? <Empty label="Aucune fonction" /> : functions.map((f) => (
                <button key={f.name} onClick={() => setQuery((q) => `${q} ${f.name}`)} className="w-full rounded-md px-2 py-1.5 text-left hover:bg-card transition-colors">
                  <p className="text-xs font-mono text-emerald-300">{f.signature ?? f.name}</p>
                  {f.description && <p className="text-[11px] text-gray-600">{f.description}</p>}
                </button>
              ))}
            </TabsContent>

            <TabsContent value="history" className="space-y-1.5 max-h-96 overflow-auto">
              {history.length === 0 ? <Empty label="Aucune requête récente" /> : history.map((h, i) => (
                <button key={i} onClick={() => setQuery(h.query)} className="w-full rounded-lg border border-border px-3 py-2 text-left hover:bg-card transition-colors">
                  <p className="text-xs font-mono text-gray-300 line-clamp-2">{h.query}</p>
                </button>
              ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <p className="py-6 text-center text-xs text-gray-600">{label}</p>
}

function fmt(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
