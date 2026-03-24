import { useState, useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { SkeletonTable } from '@/components/Skeleton'
import { SearchNormal1, Add, CloseCircle } from 'iconsax-react'
import { format, parseISO } from 'date-fns'

const CATEGORIAS = ['Salário', 'Freelance', 'Investimentos', 'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Assinaturas', 'Educação', 'Lazer', 'Outros']
const CONTAS = ['Nubank', 'Inter', 'XP', 'Itaú', 'Bradesco', 'Importado', 'Outra']
const BADGE_COLORS = {
  Salário: 'bg-green-500/20 text-green-400', Freelance: 'bg-emerald-500/20 text-emerald-400', Investimentos: 'bg-blue-500/20 text-blue-400',
  Moradia: 'bg-indigo-500/20 text-indigo-400', Alimentação: 'bg-orange-500/20 text-orange-400', Transporte: 'bg-cyan-500/20 text-cyan-400',
  Saúde: 'bg-pink-500/20 text-pink-400', Assinaturas: 'bg-purple-500/20 text-purple-400', Educação: 'bg-yellow-500/20 text-yellow-400',
  Lazer: 'bg-rose-500/20 text-rose-400', Outros: 'bg-zinc-500/20 text-muted-foreground',
}

export default function Transacoes() {
  const { transacoes, addTransaction, loading } = useData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterPeriodo, setFilterPeriodo] = useState('')
  const [form, setForm] = useState({ descricao: '', valor: '', tipo: 'despesa', categoria: 'Outros', conta: 'Nubank', data: format(new Date(), 'yyyy-MM-dd'), status: 'realizado' })
  const [formErrors, setFormErrors] = useState({})

  const filtered = useMemo(() => {
    let list = [...transacoes].sort((a, b) => (b.data || '').localeCompare(a.data || ''))
    if (search) list = list.filter(t => t.descricao?.toLowerCase().includes(search.toLowerCase()))
    if (filterCat) list = list.filter(t => t.categoria === filterCat)
    if (filterTipo) list = list.filter(t => t.tipo === filterTipo)
    if (filterPeriodo) list = list.filter(t => t.data?.startsWith(filterPeriodo))
    return list
  }, [transacoes, search, filterCat, filterTipo, filterPeriodo])

  const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return format(d, 'yyyy-MM') })

  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = {}
    if (!form.descricao.trim()) errors.descricao = 'Obrigatório'
    if (!form.valor || isNaN(parseFloat(form.valor)) || parseFloat(form.valor) <= 0) errors.valor = 'Valor inválido'
    if (!form.data) errors.data = 'Obrigatório'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    addTransaction({ descricao: form.descricao.trim(), valor: parseFloat(form.valor), tipo: form.tipo, categoria: form.categoria, conta: form.conta, data: form.data, status: form.status })
    setDialogOpen(false)
    setForm({ descricao: '', valor: '', tipo: 'despesa', categoria: 'Outros', conta: 'Nubank', data: format(new Date(), 'yyyy-MM-dd'), status: 'realizado' })
  }

  if (loading) return <SkeletonTable rows={10} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Transações</h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-indigo-500 hover:bg-indigo-600 gap-2"><Add size={18} /><span className="hidden sm:inline">Nova Transação</span></Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <SearchNormal1 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar transações..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="w-40 bg-card border-border"><option value="">Categoria</option>{CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}</Select>
        <Select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="w-32 bg-card border-border"><option value="">Tipo</option><option value="receita">Receita</option><option value="despesa">Despesa</option></Select>
        <Select value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)} className="w-36 bg-card border-border"><option value="">Período</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</Select>
      </div>

      <Card className="bg-card border-border"><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow className="border-border">
          <TableHead className="text-muted-foreground">Data</TableHead><TableHead className="text-muted-foreground">Descrição</TableHead><TableHead className="text-muted-foreground">Categoria</TableHead>
          <TableHead className="text-muted-foreground">Conta</TableHead><TableHead className="text-muted-foreground text-right">Valor</TableHead><TableHead className="text-muted-foreground">Status</TableHead>
        </TableRow></TableHeader><TableBody>
          {filtered.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center text-foreground0 py-8">Nenhuma transação encontrada</TableCell></TableRow>
          ) : filtered.map((t, i) => (
            <TableRow key={t.id || i} className="border-border hover:bg-accent/50 transition-colors">
              <TableCell className="text-foreground/80 text-sm whitespace-nowrap">{t.data ? format(parseISO(t.data), 'dd/MM/yyyy') : '-'}</TableCell>
              <TableCell className="text-foreground text-sm">{t.descricao}</TableCell>
              <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_COLORS[t.categoria] || BADGE_COLORS.Outros}`}>{t.categoria}</span></TableCell>
              <TableCell className="text-muted-foreground text-sm">{t.conta}</TableCell>
              <TableCell className={`text-right text-sm font-medium whitespace-nowrap ${t.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>{t.tipo === 'receita' ? '+' : '-'}{formatBRL(t.valor)}</TableCell>
              <TableCell><Badge variant={t.status === 'realizado' ? 'success' : 'warning'} className="text-xs">{t.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </div></CardContent></Card>

      <button onClick={() => setDialogOpen(true)} className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/25 flex items-center justify-center transition-all hover:scale-105 z-30">
        <Add size={24} className="text-white" />
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)} className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Nova Transação</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label className="text-foreground/80">Descrição</Label><Input value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="mt-1 bg-accent border-zinc-700" placeholder="Ex: Supermercado" />{formErrors.descricao && <p className="text-red-400 text-xs mt-1">{formErrors.descricao}</p>}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-foreground/80">Valor (R$)</Label><Input type="number" step="0.01" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} className="mt-1 bg-accent border-zinc-700" placeholder="0,00" />{formErrors.valor && <p className="text-red-400 text-xs mt-1">{formErrors.valor}</p>}</div>
              <div><Label className="text-foreground/80">Tipo</Label><Select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="mt-1 bg-accent border-zinc-700"><option value="despesa">Despesa</option><option value="receita">Receita</option></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-foreground/80">Categoria</Label><Select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="mt-1 bg-accent border-zinc-700">{CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}</Select></div>
              <div><Label className="text-foreground/80">Conta</Label><Select value={form.conta} onChange={e => setForm({...form, conta: e.target.value})} className="mt-1 bg-accent border-zinc-700">{CONTAS.map(c => <option key={c} value={c}>{c}</option>)}</Select></div>
            </div>
            <div><Label className="text-foreground/80">Data</Label><Input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} className="mt-1 bg-accent border-zinc-700" />{formErrors.data && <p className="text-red-400 text-xs mt-1">{formErrors.data}</p>}</div>
            {formErrors.submit && <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg"><CloseCircle size={16} className="text-red-400" variant="Bold" /><p className="text-sm text-red-400">{formErrors.submit}</p></div>}
            <div className="flex gap-3 justify-end pt-2"><Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">Salvar</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
