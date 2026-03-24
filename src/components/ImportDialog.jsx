import { useState, useRef } from 'react'
import { DocumentUpload, CloseCircle, TickCircle, DocumentText, Trash, Add } from 'iconsax-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'

export function ImportDialog({ open, onOpenChange }) {
  const { importFile, previewFile } = useData()
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState({})
  const [loading, setLoading] = useState(false)
  const [processingFile, setProcessingFile] = useState(null)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})
  const fileInputRef = useRef(null)

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
    onOpenChange(false)
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (name) => {
    if (name.endsWith('.pdf')) return 'text-red-400'
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'text-green-400'
    return 'text-blue-400'
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Importar Transações</DialogTitle>
          <DialogDescription>
            Importe múltiplos arquivos CSV, Excel ou PDF. Colunas esperadas: descricao, valor, tipo, categoria, conta, data.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <TickCircle size={32} className="text-green-400" variant="Bold" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Importação Concluída</h3>
            <p className="text-muted-foreground text-sm mb-1">{result.imported} transações importadas de {files.length} arquivo{files.length > 1 ? 's' : ''}</p>
            {result.skipped > 0 && (
              <p className="text-yellow-400 text-xs">{result.skipped} linhas ignoradas</p>
            )}
            <Button onClick={handleClose} className="mt-6 bg-indigo-500 hover:bg-indigo-600">Fechar</Button>
          </div>
        ) : (
          <>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-500/50') }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-indigo-500/50') }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <DocumentUpload size={36} className="text-muted-foreground group-hover:text-indigo-400 transition-colors mb-2" variant="Linear" />
              <p className="text-muted-foreground text-sm mb-1">Arraste arquivos ou clique para selecionar</p>
              <p className="text-muted-foreground/60 text-xs">Suporta múltiplos arquivos: .csv, .xlsx, .xls, .pdf</p>
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
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => {
                  const key = file.name + file.size
                  const preview = previews[key]
                  const error = errors[key]
                  const isProcessing = processingFile === file.name

                  return (
                    <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${error ? 'bg-red-500/5 border-red-500/20' : preview ? 'bg-accent/30 border-border' : 'bg-accent/20 border-border'}`}>
                      <DocumentText size={22} className={getFileIcon(file.name)} variant="Bold" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{file.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                          {isProcessing && <span className="text-xs text-indigo-400">Processando...</span>}
                          {preview && <span className="text-xs text-green-400">{preview.total} transações</span>}
                          {error && <span className="text-xs text-red-400 truncate">{error}</span>}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(index) }}
                        className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash size={16} variant="Linear" />
                      </button>
                    </div>
                  )
                })}

                {/* Add more files button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 w-full p-2 text-sm text-muted-foreground hover:text-indigo-400 hover:bg-accent/30 rounded-lg transition-colors border border-dashed border-border"
                >
                  <Add size={18} />
                  Adicionar mais arquivos
                </button>
              </div>
            )}

            {/* Preview table for first file with preview */}
            {(() => {
              const firstPreview = Object.values(previews)[0]
              if (!firstPreview || firstPreview.preview.length === 0) return null
              return (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Preview (primeiras 5 de {totalTransactions} transações totais)</p>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-accent/30">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Descrição</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Valor</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Tipo</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Categoria</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {firstPreview.preview.map((row, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                            <td className="py-2 px-3 text-foreground/80">{row.descricao}</td>
                            <td className={`py-2 px-3 font-medium ${row.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>{formatBRL(row.valor)}</td>
                            <td className="py-2 px-3 text-muted-foreground capitalize">{row.tipo}</td>
                            <td className="py-2 px-3 text-muted-foreground">{row.categoria}</td>
                            <td className="py-2 px-3 text-muted-foreground">{row.data}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}

            {/* Actions */}
            {files.length > 0 && !loading && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {files.length} arquivo{files.length > 1 ? 's' : ''} &middot; {totalTransactions} transações
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                  <Button onClick={handleImport} disabled={totalTransactions === 0} className="bg-indigo-500 hover:bg-indigo-600">
                    Importar {totalTransactions} transações
                  </Button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-3 py-4 justify-center">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">
                  {processingFile ? `Processando ${processingFile}...` : 'Importando...'}
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
