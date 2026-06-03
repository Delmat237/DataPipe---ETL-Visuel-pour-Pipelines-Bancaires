'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Play, AlertTriangle, Wand2, Braces, Tags, ScanText, HelpCircle, Lightbulb, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { aiApi } from '@/lib/api/ai'
import { toast } from 'sonner'

const SAMPLE_DATA = `[
  { "id": 1, "name": "Alice", "amount": 120, "country": "FR" },
  { "id": 2, "name": "Bob", "amount": 95, "country": "US" },
  { "id": 3, "name": "Carlos", "amount": 9800, "country": "ES" },
  { "id": 4, "name": "  dana ", "amount": null, "country": "fr" }
]`

function ResultPanel({ result, loading }: { result: unknown; loading: boolean }) {
  if (loading) return <div className="rounded-lg border border-border bg-background p-4 text-sm text-gray-500">Traitement en cours…</div>
  if (result == null) return <div className="rounded-lg border border-dashed border-border p-4 text-sm text-gray-600">Le résultat s&apos;affichera ici.</div>
  return (
    <pre className="max-h-[420px] overflow-auto rounded-lg border border-border bg-background p-4 text-xs text-gray-300 font-mono whitespace-pre-wrap">
      {JSON.stringify(result, null, 2)}
    </pre>
  )
}

function parseData(text: string): unknown[] | null {
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : null
  } catch { return null }
}

export default function AiToolsPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Sparkles className="h-5 w-5 text-primary" /></div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Outils IA</h1>
          <p className="text-sm text-gray-500">Détection d&apos;anomalies, nettoyage, classification et plus</p>
        </div>
      </div>

      <Tabs defaultValue="anomalies">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="anomalies"><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Anomalies</TabsTrigger>
          <TabsTrigger value="clean"><Wand2 className="h-3.5 w-3.5 mr-1.5" /> Nettoyage</TabsTrigger>
          <TabsTrigger value="schema"><Braces className="h-3.5 w-3.5 mr-1.5" /> Schéma</TabsTrigger>
          <TabsTrigger value="classify"><Tags className="h-3.5 w-3.5 mr-1.5" /> Classification</TabsTrigger>
          <TabsTrigger value="entities"><ScanText className="h-3.5 w-3.5 mr-1.5" /> Entités</TabsTrigger>
          <TabsTrigger value="explain"><HelpCircle className="h-3.5 w-3.5 mr-1.5" /> Expliquer un nœud</TabsTrigger>
          <TabsTrigger value="suggest"><Lightbulb className="h-3.5 w-3.5 mr-1.5" /> Suggérer</TabsTrigger>
          <TabsTrigger value="models"><Cpu className="h-3.5 w-3.5 mr-1.5" /> Modèles</TabsTrigger>
        </TabsList>

        <TabsContent value="anomalies"><AnomaliesTool /></TabsContent>
        <TabsContent value="clean"><DataTool title="Nettoyage automatique" description="Corrige les valeurs manquantes, espaces et incohérences." run={(d) => aiApi.cleanData(d)} /></TabsContent>
        <TabsContent value="schema"><DataTool title="Inférence de schéma" description="Génère un schéma JSON à partir d'un échantillon." run={(d) => aiApi.generateSchema(d)} /></TabsContent>
        <TabsContent value="classify"><ClassifyTool /></TabsContent>
        <TabsContent value="entities"><EntitiesTool /></TabsContent>
        <TabsContent value="explain"><ExplainNodeTool /></TabsContent>
        <TabsContent value="suggest"><SuggestTool /></TabsContent>
        <TabsContent value="models"><ModelsTool /></TabsContent>
      </Tabs>
    </div>
  )
}

function ToolLayout({ title, description, controls, result, loading }: {
  title: string; description: string; controls: React.ReactNode; result: unknown; loading: boolean
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">{controls}</CardContent>
      </Card>
      <div className="space-y-2">
        <Label className="text-xs text-gray-500">Résultat</Label>
        <ResultPanel result={result} loading={loading} />
      </div>
    </div>
  )
}

function DataTool({ title, description, run }: { title: string; description: string; run: (data: unknown[]) => Promise<unknown> }) {
  const [text, setText] = useState(SAMPLE_DATA)
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    const data = parseData(text)
    if (!data) { toast.error('JSON tableau invalide'); return }
    setLoading(true); setResult(null)
    try { setResult(await run(data)) } catch { toast.error('Erreur IA') } finally { setLoading(false) }
  }

  return (
    <ToolLayout
      title={title}
      description={description}
      result={result}
      loading={loading}
      controls={<>
        <div className="space-y-1.5">
          <Label>Données (tableau JSON)</Label>
          <Textarea className="font-mono text-xs h-52" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <Button className="gap-2" onClick={handleRun} disabled={loading}><Play className="h-4 w-4" /> Exécuter</Button>
      </>}
    />
  )
}

function AnomaliesTool() {
  const [text, setText] = useState(SAMPLE_DATA)
  const [field, setField] = useState('amount')
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    const data = parseData(text)
    if (!data) { toast.error('JSON tableau invalide'); return }
    setLoading(true); setResult(null)
    try { setResult(await aiApi.detectAnomalies(data, field || undefined)) }
    catch { toast.error('Erreur IA') } finally { setLoading(false) }
  }

  const handleBatch = async () => {
    setLoading(true); setResult(null)
    try { setResult(await aiApi.detectAnomaliesBatch()) }
    catch { toast.error('Erreur IA') } finally { setLoading(false) }
  }

  return (
    <ToolLayout
      title="Détection d'anomalies"
      description="Repère les valeurs aberrantes via z-score."
      result={result}
      loading={loading}
      controls={<>
        <div className="space-y-1.5">
          <Label>Données (tableau JSON)</Label>
          <Textarea className="font-mono text-xs h-44" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Champ numérique</Label>
          <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="amount" />
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={handleRun} disabled={loading}><Play className="h-4 w-4" /> Analyser</Button>
          <Button variant="outline" onClick={handleBatch} disabled={loading}>Analyse globale (batch)</Button>
        </div>
      </>}
    />
  )
}

function ClassifyTool() {
  const [text, setText] = useState(SAMPLE_DATA)
  const [categories, setCategories] = useState('premium, standard, suspect')
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    const data = parseData(text)
    if (!data) { toast.error('JSON tableau invalide'); return }
    const cats = categories.split(',').map((c) => c.trim()).filter(Boolean)
    if (cats.length === 0) { toast.error('Au moins une catégorie'); return }
    setLoading(true); setResult(null)
    try { setResult(await aiApi.classify(data, cats)) } catch { toast.error('Erreur IA') } finally { setLoading(false) }
  }

  return (
    <ToolLayout
      title="Classification"
      description="Classe chaque ligne dans une catégorie."
      result={result}
      loading={loading}
      controls={<>
        <div className="space-y-1.5">
          <Label>Données (tableau JSON)</Label>
          <Textarea className="font-mono text-xs h-44" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Catégories (séparées par des virgules)</Label>
          <Input value={categories} onChange={(e) => setCategories(e.target.value)} />
        </div>
        <Button className="gap-2" onClick={handleRun} disabled={loading}><Play className="h-4 w-4" /> Classifier</Button>
      </>}
    />
  )
}

function EntitiesTool() {
  const [text, setText] = useState('Facture #4821 de 1 250,00 € émise le 12/03/2026 pour Jean Dupont.')
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) { toast.error('Texte requis'); return }
    setLoading(true); setResult(null)
    try { setResult(await aiApi.extractEntities(lines)) } catch { toast.error('Erreur IA') } finally { setLoading(false) }
  }

  return (
    <ToolLayout
      title="Extraction d'entités"
      description="Extrait montants, dates, noms (une ligne = un texte)."
      result={result}
      loading={loading}
      controls={<>
        <div className="space-y-1.5">
          <Label>Textes</Label>
          <Textarea className="text-sm h-44" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <Button className="gap-2" onClick={handleRun} disabled={loading}><Play className="h-4 w-4" /> Extraire</Button>
      </>}
    />
  )
}

function ExplainNodeTool() {
  const [nodeType, setNodeType] = useState('filter')
  const [configText, setConfigText] = useState('{\n  "column": "amount",\n  "operator": ">",\n  "value": 100\n}')
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    if (!nodeType.trim()) { toast.error('Type de nœud requis'); return }
    let config: unknown
    try { config = configText.trim() ? JSON.parse(configText) : undefined }
    catch { toast.error('Config JSON invalide'); return }
    setLoading(true); setResult(null)
    try { setResult(await aiApi.explainNode(nodeType, config)) } catch { toast.error('Erreur IA') } finally { setLoading(false) }
  }

  return (
    <ToolLayout
      title="Expliquer un nœud"
      description="Décrit en langage naturel ce que fait un nœud."
      result={result}
      loading={loading}
      controls={<>
        <div className="space-y-1.5">
          <Label>Type de nœud</Label>
          <Input value={nodeType} onChange={(e) => setNodeType(e.target.value)} placeholder="filter, transform, join…" />
        </div>
        <div className="space-y-1.5">
          <Label>Configuration (JSON)</Label>
          <Textarea className="font-mono text-xs h-36" value={configText} onChange={(e) => setConfigText(e.target.value)} />
        </div>
        <Button className="gap-2" onClick={handleRun} disabled={loading}><Play className="h-4 w-4" /> Expliquer</Button>
      </>}
    />
  )
}

function SuggestTool() {
  const [goal, setGoal] = useState('Analyser les ventes mensuelles et détecter les pics inhabituels')
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    if (!goal.trim()) { toast.error('Objectif requis'); return }
    setLoading(true); setResult(null)
    try { setResult(await aiApi.suggestPipeline(goal)) } catch { toast.error('Erreur IA') } finally { setLoading(false) }
  }

  return (
    <ToolLayout
      title="Suggérer un pipeline"
      description="Propose une structure de pipeline depuis un objectif."
      result={result}
      loading={loading}
      controls={<>
        <div className="space-y-1.5">
          <Label>Objectif</Label>
          <Textarea className="text-sm h-44" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
        <Button className="gap-2" onClick={handleRun} disabled={loading}><Play className="h-4 w-4" /> Suggérer</Button>
      </>}
    />
  )
}

function ModelsTool() {
  const [models, setModels] = useState<unknown>(null)
  const [usage, setUsage] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([aiApi.getModels(), aiApi.getUsage()])
      .then(([m, u]) => { setModels(m); setUsage(u) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <Label className="text-xs text-gray-500 flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" /> Modèles disponibles</Label>
        <ResultPanel result={models} loading={loading} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-gray-500 flex items-center gap-1.5"><Badge variant="secondary" className="h-5">tokens</Badge> Utilisation IA</Label>
        <ResultPanel result={usage} loading={loading} />
      </div>
    </div>
  )
}
