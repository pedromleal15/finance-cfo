import { useState, useRef } from 'react'
import { DocumentUpload, CloseCircle, TickCircle, DocumentText, Trash, Add } from 'iconsax-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { cn } from '@/lib/utils'

// Map file extensions to colour accents and labels
function getFileTypeMeta(name = '') {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'csv':
      return { label: 'CSV', color: 'hsl(217 91% 60%)', bg: 'hsl(217 91% 60% / 0.12)' }
    case 'xlsx':
    case 'xls':
      return { label: ext.toUpperCase(), color: 'hsl(142 71% 45%)', bg: 'hsl(142 71% 45% / 0.12)' }
    case 'pdf':
      return { label: 'PDF', color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.12)' }
    default:
      return { label: ext?.toUpperCase() ?? 'FILE', color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted) / 0.5)' }
  }
}

export function ImportDialog({ open, onOpenChange }) {
  const { importFile, previewFile } = useData()
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState({})
  const [loading, setLoading] = useState(false)
  const [processingFile, setProcessingFile] = useState(null)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // ── Logic handlers (all original logic preserved) ─────────────────────────

  const processFile = async (file) => {
    const key = file.name + file.size
    setProcessingFile(file.name)
    try {
      const previewData = await previewFile(file)
      setPreviews(prev => ({ ...prev, [key]: previewData }))
      setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    } catch (err) {
      setErrors(prev => ({ ...prev, [key]: err.message }))
      setPreviews(prev => { const n = { ...prev }; delete n[key]; return n })
    }
    setProcessingFile(null)
  }

  const handleFileSelect = async (e) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length) return
    setResult(null)
    const newFiles = [...files]
    for (const f of selected) {
      const exists = newFiles.some(ef => ef.name === f.name && ef.size === f.size)
      if (!exists) newFiles.push(f)
    }
    setFiles(newFiles)
    setLoading(true)
    for (const f of selected) {
      const exists = files.some(ef => ef.name === f.name && ef.size === f.size)
      if (!exists) await processFile(f)
    }
    setLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = Array.from(e.dataTransfer.files || [])
    if (!dropped.length) return
    setResult(null)
    const newFiles = [...files]
    for (const f of dropped) {
      const exists = newFiles.some(ef => ef.name === f.name && ef.size === f.size)
      if (!exists) newFiles.push(f)
    }
    setFiles(newFiles)
    setLoading(true)
    for (const f of dropped) {
      const exists = files.some(ef => ef.name === f.name && ef.size === f.size)
      if (!exists) await processFile(f)
    }
    setLoading(false)
  }

  const removeFile = (index) => {
    const file = files[index]
    const key = file.name + file.size
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => { const n = { ...prev }; delete n[key]; return n })
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const totalTransactions = Object.values(previews).reduce((sum, p) => sum + (p?.total || 0), 0)

  const handleImport = async () => {
    if (!files.length) return
    setLoading(true)
    let totalImported = 0
    let totalSkipped = 0
    const importErrors = {}

    for (const file of files) {
      const key = file.name + file.size
      if (errors[key]) continue
      try {
        const r = await importFile(file)
        totalImported += r.imported
        totalSkipped += r.skipped
      } catch (err) {
        importErrors[key] = err.message
      }
    }

    if (Object.keys(importErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...importErrors }))
    }

    setResult({ imported: totalImported, skipped: totalSkipped })
    setLoading(false)
  }

  const handleClose = () => {
    setFiles([])
    setPreviews({})
    setResult(null)
    setErrors({})
    setProcessingFile(null)
    setIsDragOver(false)
    onOpenChange(false)
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ── First file preview (for the table) ────────────────────────────────────
  const firstPreview = Object.values(previews)[0]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="max-w-2xl bg-card border-border shadow-2xl">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-foreground text-lg font-semibold tracking-tight">
            Importar Transações
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
            Importe múltiplos arquivos CSV, Excel ou PDF. Colunas esperadas:{' '}
            <span className="font-medium text-foreground/80">
              descricao, valor, tipo, categoria, conta, data.
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* ── Success state ─────────────────────────────────────────────── */}
        {result && (
          <div className="flex flex-col items-center py-10">
            <div className="relative mb-5 animate-check-pop">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, hsl(142 71% 45% / 0.18), hsl(142 71% 45% / 0.06))',
                  border: '1px solid hsl(142 71% 45% / 0.3)',
                  boxShadow: '0 8px 32px hsl(142 71% 45% / 0.15)',
                }}
              >
                <TickCircle size={36} className="text-emerald-500" variant="Bold" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-3 tracking-tight">
              Importação Concluída
            </h3>

            {/* Stats row */}
            <div className="flex gap-6 mb-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-500 tabular-nums">{result.imported}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  transações importadas de {files.length} arquivo{files.length > 1 ? 's' : ''}
                </p>
              </div>
              {result.skipped > 0 && (
                <>
                  <div className="w-px bg-border" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-500 tabular-nums">{result.skipped}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">linhas ignoradas</p>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleClose}
              className="mt-6 px-6 font-semibold"
              style={{
                background: 'linear-gradient(135deg, hsl(239 84% 72%), hsl(239 84% 55%))',
                boxShadow: '0 4px 16px hsl(239 84% 67% / 0.35)',
              }}
            >
              Fechar
            </Button>
          </div>
        )}

        {/* ── Main content ──────────────────────────────────────────────── */}
        {!result && (
          <div className="space-y-4 pt-1">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer',
                'transition-all duration-200 group border-2 border-dashed',
                isDragOver
                  ? 'border-primary bg-primary/8 scale-[1.01]'
                  : 'border-border hover:border-primary/50 hover:bg-primary/4',
              )}
            >
              {/* Radial glow on hover/drag */}
              <div
                className={cn(
                  'absolute inset-0 rounded-xl transition-opacity duration-200 pointer-events-none',
                  isDragOver ? 'opacity-100' : 'opacity-0 group-hover:opacity-70',
                )}
                style={{
                  background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
                }}
              />

              {/* Upload icon */}
              <div
                className={cn(
                  'relative w-12 h-12 rounded-2xl flex items-center justify-center mb-3',
                  'transition-all duration-200',
                  isDragOver
                    ? 'bg-primary/20 scale-110'
                    : 'bg-accent/70 group-hover:bg-primary/12 group-hover:scale-105',
                )}
              >
                <DocumentUpload
                  size={24}
                  variant="Linear"
                  className={cn(
                    'transition-all duration-200',
                    isDragOver
                      ? 'text-primary -translate-y-1'
                      : 'text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5',
                  )}
                />
              </div>

              <p
                className={cn(
                  'relative text-sm font-medium mb-0.5 transition-colors duration-150',
                  isDragOver ? 'text-primary' : 'text-foreground/80',
                )}
              >
                {isDragOver ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
              </p>
              <p className="relative text-xs text-muted-foreground/70 mb-3">
                Suporta múltiplos arquivos: .csv, .xlsx, .xls, .pdf
              </p>

              {/* Type badges */}
              <div className="relative flex gap-1.5">
                {['CSV', 'XLSX', 'XLS', 'PDF'].map((ext) => (
                  <span
                    key={ext}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted/80 text-muted-foreground border border-border/50"
                  >
                    {ext}
                  </span>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt,.pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                {files.map((file, index) => {
                  const key = file.name + file.size
                  const preview = previews[key]
                  const error = errors[key]
                  const isProcessing = processingFile === file.name
                  const meta = getFileTypeMeta(file.name)

                  return (
                    <div
                      key={key}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border transition-all duration-150',
                        error
                          ? 'bg-red-500/5 border-red-500/20'
                          : preview
                            ? 'bg-accent/30 border-border'
                            : 'bg-accent/20 border-border',
                      )}
                    >
                      {/* File type icon */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: meta.bg }}
                      >
                        <DocumentText size={18} variant="Bold" style={{ color: meta.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate leading-tight">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {/* Extension pill */}
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ color: meta.color, background: meta.bg }}
                          >
                            {meta.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>

                          {isProcessing && (
                            <span className="flex items-center gap-1 text-xs text-primary">
                              <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin inline-block" />
                              Processando...
                            </span>
                          )}
                          {preview && !isProcessing && (
                            <span className="text-xs text-emerald-500 font-medium">
                              {preview.total} transações
                            </span>
                          )}
                          {error && (
                            <span className="flex items-center gap-1 text-xs text-red-400 truncate">
                              <CloseCircle size={12} variant="Bold" className="flex-shrink-0" />
                              {error}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(index) }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 flex-shrink-0"
                        title="Remover arquivo"
                      >
                        <Trash size={14} variant="Linear" />
                      </button>
                    </div>
                  )
                })}

                {/* Add more files */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex items-center gap-2 w-full p-2.5 text-sm font-medium rounded-xl',
                    'text-muted-foreground hover:text-primary',
                    'border border-dashed border-border hover:border-primary/40',
                    'hover:bg-primary/4 transition-all duration-150',
                  )}
                >
                  <Add size={16} />
                  Adicionar mais arquivos
                </button>
              </div>
            )}

            {/* Preview table — first file with data */}
            {firstPreview && firstPreview.preview.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">
                    Preview — primeiras linhas de {totalTransactions} transações totais
                  </p>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'hsl(var(--primary) / 0.12)',
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    {totalTransactions} transações
                  </span>
                </div>

                <div
                  className="overflow-x-auto rounded-lg border border-border/60"
                  style={{ background: 'hsl(var(--background) / 0.5)' }}
                >
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-accent/30">
                        <th className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">Descrição</th>
                        <th className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">Valor</th>
                        <th className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">Tipo</th>
                        <th className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">Categoria</th>
                        <th className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firstPreview.preview.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-foreground/80 max-w-[160px] truncate">
                            {row.descricao}
                          </td>
                          <td
                            className={cn(
                              'py-2.5 px-3 font-medium tabular-nums whitespace-nowrap',
                              row.tipo === 'receita' ? 'text-emerald-500' : 'text-red-400',
                            )}
                          >
                            {formatBRL(row.valor)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={cn(
                                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize',
                                row.tipo === 'receita'
                                  ? 'bg-emerald-500/12 text-emerald-500'
                                  : 'bg-red-500/12 text-red-400',
                              )}
                            >
                              {row.tipo}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                            {row.categoria}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap tabular-nums">
                            {row.data}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center gap-3 py-3 justify-center">
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 rounded-full border-2 border-border" />
                  <div
                    className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                    style={{
                      borderTopColor: 'hsl(var(--primary))',
                      borderRightColor: 'hsl(var(--primary) / 0.3)',
                    }}
                  />
                </div>
                <p className="text-muted-foreground text-sm">
                  {processingFile ? `Processando ${processingFile}...` : 'Importando...'}
                </p>
              </div>
            )}

            {/* Action buttons */}
            {files.length > 0 && !loading && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  {files.length} arquivo{files.length > 1 ? 's' : ''}&nbsp;&middot;&nbsp;
                  <span className="text-foreground font-medium">{totalTransactions}</span> transações
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={totalTransactions === 0}
                    className="px-5 font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, hsl(239 84% 72%), hsl(239 84% 55%))',
                      boxShadow: '0 4px 12px hsl(239 84% 67% / 0.35)',
                    }}
                  >
                    Importar {totalTransactions} transações
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
