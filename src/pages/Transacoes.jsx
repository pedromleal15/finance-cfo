import { useState, useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { SkeletonTable } from '@/components/Skeleton'
import { SearchNormal1, Add, CloseCircle, Filter, ArrowUp, ArrowDown } from 'iconsax-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CATEGORIAS = [
  'Salário', 'Freelance', 'Investimentos', 'Moradia', 'Alimentação',
  'Transporte', 'Saúde', 'Assinaturas', 'Educação', 'Lazer', 'Outros',
]
const CONTAS = ['Nubank', 'Inter', 'XP', 'Itaú', 'Bradesco', 'Importado', 'Outra']

const BADGE_COLORS = {
  Salário:      { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  Freelance:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  Investimentos:{ color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  Moradia:      { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  Alimentação:  { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  Transporte:   { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  Saúde:        { color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  Assinaturas:  { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  Educação:     { color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  Lazer:        { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
  Outros:       { color: '#71717a', bg: 'rgba(113,113,122,0.12)' },
}

const CategoryBadge = ({ categoria }) => {
  const style = BADGE_COLORS[categoria] || BADGE_COLORS.Outros
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: style.color, backgroundColor: style.bg }}
    >
      {categoria}
    </span>
  )
}

const FormField = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <Label className="text-sm text-muted-foreground font-medium">{label}</Label>
    {children}
    {error && (
      <p className="text-xs text-red-400 flex items-center gap-1">
        <CloseCircle size={12} variant="Bold" />
        {error}
      </p>
    )}
  </div>
)

export default function Transacoes() {
  const { transacoes, addTransaction, loading } = useData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterPeriodo, setFilterPeriodo] = useState('')
  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    tipo: 'despesa',
    categoria: 'Outros',
    conta: 'Nubank',
    data: format(new Date(), 'yyyy-MM-dd'),
    status: 'realizado',
  })
  const [formErrors, setFormErrors] = useState({})

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return format(d, 'yyyy-MM')
  })

  const filtered = useMemo(() => {
    let list = [...transacoes].sort((a, b) => (b.data || '').localeCompare(a.data || ''))
    if (search) list = list.filter(t => t.descricao?.toLowerCase().includes(search.toLowerCase()))
    if (filterCat) list = list.filter(t => t.categoria === filterCat)
    if (filterTipo) list = list.filter(t => t.tipo === filterTipo)
    if (filterPeriodo) list = list.filter(t => t.data?.startsWith(filterPeriodo))
    return list
  }, [transacoes, search, filterCat, filterTipo, filterPeriodo])

  const totals = useMemo(() => {
    const receita = filtered.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
    const despesa = filtered.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
    return { receita, despesa, liquido: receita - despesa }
  }, [filtered])

  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = {}
    if (!form.descricao.trim()) errors.descricao = 'Descrição obrigatória'
    if (!form.valor || isNaN(parseFloat(form.valor)) || parseFloat(form.valor) <= 0) errors.valor = 'Informe um valor válido'
    if (!form.data) errors.data = 'Data obrigatória'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    addTransaction({
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor),
      tipo: form.tipo,
      categoria: form.categoria,
      conta: form.conta,
      data: form.data,
      status: form.status,
    })
    setDialogOpen(false)
    setForm({
      descricao: '',
      valor: '',
      tipo: 'despesa',
      categoria: 'Outros',
      conta: 'Nubank',
      data: format(new Date(), 'yyyy-MM-dd'),
      status: 'realizado',
    })
    setFormErrors({})
  }

  const hasActiveFilters = search || filterCat || filterTipo || filterPeriodo
  const clearFilters = () => {
    setSearch('')
    setFilterCat('')
    setFilterTipo('')
    setFilterPeriodo('')
  }

  if (loading) return <SkeletonTable rows={10} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Transações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{transacoes.length} transações no total</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/25 gap-2 transition-all hover:shadow-indigo-500/30"
        >
          <Add size={18} />
          <span className="hidden sm:inline">Nova Transação</span>
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowDown size={12} className="text-emerald-400" variant="Bold" />
            <p className="text-xs text-emerald-400 font-medium">Receitas</p>
          </div>
          <p className="text-base font-bold text-emerald-400 tabular-nums">{formatBRL(totals.receita)}</p>
        </div>
        <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowUp size={12} className="text-red-400" variant="Bold" />
            <p className="text-xs text-red-400 font-medium">Despesas</p>
          </div>
          <p className="text-base font-bold text-red-400 tabular-nums">{formatBRL(totals.despesa)}</p>
        </div>
        <div className={cn(
          'rounded-xl p-3 text-center border',
          totals.liquido >= 0 ? 'bg-indigo-500/5 border-indigo-500/15' : 'bg-red-500/5 border-red-500/15'
        )}>
          <p className="text-xs text-muted-foreground font-medium mb-1">Líquido</p>
          <p className={cn('text-base font-bold tabular-nums', totals.liquido >= 0 ? 'text-indigo-400' : 'text-red-400')}>
            {formatBRL(totals.liquido)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <SearchNormal1 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-accent/40 border-border h-9 text-sm"
              />
            </div>
            <Select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="w-40 bg-accent/40 border-border h-9 text-sm"
            >
              <option value="">Categoria</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
              className="w-32 bg-accent/40 border-border h-9 text-sm"
            >
              <option value="">Tipo</option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </Select>
            <Select
              value={filterPeriodo}
              onChange={e => setFilterPeriodo(e.target.value)}
              className="w-36 bg-accent/40 border-border h-9 text-sm"
            >
              <option value="">Período</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                <CloseCircle size={13} />
                Limpar
              </button>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <Filter size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide pl-6 w-24">Data</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide">Descrição</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide">Categoria</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide hidden md:table-cell">Conta</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide text-right">Valor</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide pr-6 hidden sm:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center gap-2">
                        <SearchNormal1 size={24} className="text-muted-foreground/40" />
                        <span className="text-sm">Nenhuma transação encontrada</span>
                        {hasActiveFilters && (
                          <button onClick={clearFilters} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                            Limpar filtros
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t, i) => (
                    <TableRow
                      key={t.id || i}
                      className={cn(
                        'border-border transition-colors',
                        i % 2 === 0 ? 'bg-transparent' : 'bg-accent/20',
                        'hover:bg-accent/50'
                      )}
                    >
                      <TableCell className="text-muted-foreground text-sm pl-6 whitespace-nowrap">
                        {t.data ? format(parseISO(t.data), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-foreground text-sm font-medium max-w-[200px] truncate">
                        {t.descricao}
                      </TableCell>
                      <TableCell>
                        <CategoryBadge categoria={t.categoria} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                        {t.conta}
                      </TableCell>
                      <TableCell className={cn(
                        'text-right text-sm font-bold whitespace-nowrap tabular-nums',
                        t.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {t.tipo === 'receita' ? '+' : '-'}{formatBRL(t.valor)}
                      </TableCell>
                      <TableCell className="pr-6 hidden sm:table-cell">
                        <Badge
                          variant={t.status === 'realizado' ? 'success' : 'warning'}
                          className="text-xs"
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* FAB (mobile) */}
      <button
        onClick={() => setDialogOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 rounded-full shadow-xl shadow-indigo-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-30"
        aria-label="Nova Transação"
      >
        <Add size={24} className="text-white" />
      </button>

      {/* Add Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)} className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg font-semibold">Nova Transação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <FormField label="Descrição" error={formErrors.descricao}>
              <Input
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                className="bg-accent/40 border-border focus:border-indigo-500"
                placeholder="Ex: Supermercado"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Valor (R$)" error={formErrors.valor}>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.valor}
                  onChange={e => setForm({ ...form, valor: e.target.value })}
                  className="bg-accent/40 border-border focus:border-indigo-500"
                  placeholder="0,00"
                />
              </FormField>
              <FormField label="Tipo">
                <Select
                  value={form.tipo}
                  onChange={e => setForm({ ...form, tipo: e.target.value })}
                  className="bg-accent/40 border-border focus:border-indigo-500"
                >
                  <option value="despesa">Despesa</option>
                  <option value="receita">Receita</option>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Categoria">
                <Select
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                  className="bg-accent/40 border-border focus:border-indigo-500"
                >
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormField>
              <FormField label="Conta">
                <Select
                  value={form.conta}
                  onChange={e => setForm({ ...form, conta: e.target.value })}
                  className="bg-accent/40 border-border focus:border-indigo-500"
                >
                  {CONTAS.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Data" error={formErrors.data}>
                <Input
                  type="date"
                  value={form.data}
                  onChange={e => setForm({ ...form, data: e.target.value })}
                  className="bg-accent/40 border-border focus:border-indigo-500"
                />
              </FormField>
              <FormField label="Status">
                <Select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="bg-accent/40 border-border focus:border-indigo-500"
                >
                  <option value="realizado">Realizado</option>
                  <option value="pendente">Pendente</option>
                </Select>
              </FormField>
            </div>

            {formErrors.submit && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <CloseCircle size={16} className="text-red-400 flex-shrink-0" variant="Bold" />
                <p className="text-sm text-red-400">{formErrors.submit}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setDialogOpen(false); setFormErrors({}) }}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
              >
                Salvar Transação
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
