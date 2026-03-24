import { useState, useRef } from 'react'
import { DocumentUpload, CloseCircle, TickCircle, DocumentText, Trash } from 'iconsax-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'

export function ImportDialog({ open, onOpenChange }) {
  const { importFile, previewFile } = useData()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const previewData = await previewFile(selectedFile)
      setPreview(previewData)
    } catch (err) {
      setError(err.message)
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const importResult = await importFile(file)
      setResult(importResult)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    onOpenChange(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (!droppedFile) return
    setFile(droppedFile)
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const previewData = await previewFile(droppedFile)
      setPreview(previewData)
    } catch (err) {
      setError(err.message)
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="max-w-xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Importar Transações</DialogTitle>
          <DialogDescription>
            Importe um arquivo CSV, Excel ou PDF com suas transações. Colunas esperadas: descricao, valor, tipo, categoria, conta, data.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <TickCircle size={32} className="text-green-400" variant="Bold" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Importação Concluída</h3>
            <p className="text-muted-foreground text-sm mb-1">{result.imported} transações importadas</p>
            {result.skipped > 0 && (
              <p className="text-yellow-400 text-xs">{result.skipped} linhas ignoradas</p>
            )}
            <Button onClick={handleClose} className="mt-6 bg-indigo-500 hover:bg-indigo-600">Fechar</Button>
          </div>
        ) : (
          <>
            {!file && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/50 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group"
              >
                <DocumentUpload size={40} className="text-foreground0 group-hover:text-indigo-400 transition-colors mb-3" variant="Linear" />
                <p className="text-muted-foreground text-sm mb-1">Arraste um arquivo ou clique para selecionar</p>
                <p className="text-muted-foreground/60 text-xs">.csv, .xlsx, .xls, .pdf</p>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt,.pdf" onChange={handleFileSelect} className="hidden" />
              </div>
            )}

            {file && !loading && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                  <DocumentText size={24} className="text-indigo-400" variant="Bold" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-foreground0">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => { setFile(null); setPreview(null); setError(null) }} className="text-foreground0 hover:text-red-400 transition-colors">
                    <Trash size={18} variant="Linear" />
                  </button>
                </div>

                {preview && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Preview ({preview.total} transações encontradas)</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 text-foreground0">Descrição</th>
                            <th className="text-left py-2 px-2 text-foreground0">Valor</th>
                            <th className="text-left py-2 px-2 text-foreground0">Tipo</th>
                            <th className="text-left py-2 px-2 text-foreground0">Categoria</th>
                            <th className="text-left py-2 px-2 text-foreground0">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.preview.map((row, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-2 px-2 text-foreground/80">{row.descricao}</td>
                              <td className={`py-2 px-2 ${row.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>{formatBRL(row.valor)}</td>
                              <td className="py-2 px-2 text-muted-foreground capitalize">{row.tipo}</td>
                              <td className="py-2 px-2 text-muted-foreground">{row.categoria}</td>
                              <td className="py-2 px-2 text-muted-foreground">{row.data}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg">
                    <CloseCircle size={18} className="text-red-400" variant="Bold" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                  <Button onClick={handleImport} disabled={!preview || preview.total === 0} className="bg-indigo-500 hover:bg-indigo-600">
                    Importar {preview?.total || 0} transações
                  </Button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center py-8">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground text-sm">Processando arquivo...</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
