'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, Trash2, Eye, RefreshCw, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { filesApi } from '@/lib/api/files'
import { formatBytes, getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { DataFile } from '@/types'

type PreviewData = { columns: string[]; rows: Record<string, unknown>[] }

export default function FilesPage() {
  const [files, setFiles] = useState<DataFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewFile, setPreviewFile] = useState<DataFile | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadFiles() }, [])

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      const data = await filesApi.list()
      setFiles(data)
    } catch { toast.error('Erreur de chargement') }
    finally { setIsLoading(false) }
  }

  const handleUpload = async (f: File) => {
    setUploadProgress(0)
    try {
      const result = await filesApi.upload(f)
      setFiles((prev) => [result, ...prev])
      toast.success(`"${f.name}" uploadé — ${result.rows ?? '?'} lignes, ${result.columns ?? '?'} colonnes`)
    } catch {
      toast.error('Erreur lors de l\'upload')
    } finally {
      setUploadProgress(null)
    }
  }

  const handleDelete = async (file: DataFile) => {
    try {
      await filesApi.remove(file.id)
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      toast.success('Fichier supprimé')
    } catch { toast.error('Erreur') }
  }

  const handlePreview = async (file: DataFile) => {
    setPreviewFile(file)
    setPreview(null)
    setPreviewLoading(true)
    try {
      setPreview(await filesApi.preview(file.id))
    } catch { toast.error('Aperçu indisponible') }
    finally { setPreviewLoading(false) }
  }

  const handleAnalyze = async (file: DataFile) => {
    setAnalyzingId(file.id)
    try {
      await filesApi.analyze(file.id)
      const fresh = await filesApi.get(file.id)
      setFiles((prev) => prev.map((f) => (f.id === file.id ? fresh : f)))
      toast.success('Fichier ré-analysé')
    } catch { toast.error('Analyse impossible') }
    finally { setAnalyzingId(null) }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const ACCEPTED = '.csv,.json,.xlsx'

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Fichiers</h1>
          <p className="text-sm text-gray-500">{files.length} fichier{files.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => inputRef.current?.click()} className="gap-2">
          <Plus className="h-4 w-4" /> Uploader
        </Button>
      </div>

      {/* Drop zone */}
      <div
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-[#3a3a3a]'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className={`h-8 w-8 mb-3 ${isDragging ? 'text-primary' : 'text-gray-700'}`} />
        <p className="text-sm font-medium text-gray-400">Glissez un fichier ici ou cliquez pour parcourir</p>
        <p className="text-xs text-gray-600 mt-1">CSV, JSON, XLSX — max 100 MB</p>
        <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }} />
      </div>

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Upload en cours…</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Files list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-gray-600 text-sm">Aucun fichier uploadé</div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <FileText className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-600">{formatBytes(file.size_bytes)}</span>
                    {file.rows && <span className="text-xs text-gray-700">· {file.rows} lignes</span>}
                    {file.columns && <span className="text-xs text-gray-700">· {file.columns} colonnes</span>}
                    <span className="text-xs text-gray-700">· {getRelativeTime(file.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon-sm" title="Voir l'aperçu" onClick={() => handlePreview(file)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Re-analyser" onClick={() => handleAnalyze(file)} disabled={analyzingId === file.id}>
                  <RefreshCw className={`h-4 w-4 ${analyzingId === file.id ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(file)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(previewFile)} onOpenChange={(v) => { if (!v) setPreviewFile(null) }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">Aperçu — {previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : !preview || preview.rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-600">Aucune donnée à afficher</p>
          ) : (
            <div className="max-h-[60vh] overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr>
                    {preview.columns.map((c) => (
                      <th key={c} className="px-3 py-2 text-left font-semibold text-gray-400 whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {preview.columns.map((c) => (
                        <td key={c} className="px-3 py-1.5 text-gray-300 whitespace-nowrap">{formatCell(row[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatCell(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
