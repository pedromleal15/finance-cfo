import { useState, useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { SkeletonChart, SkeletonTable, SkeletonCard } from '@/components/Skeleton'
import { Calculator, TrendUp, TrendDown, MoneyRecive, MoneySend } from 'iconsax-react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, subMonths, subQuarters, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PERIODO_LABELS = { mes: 'Mês', trimestre: 'Trimestre', ano: 'Ano' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-xl p-3 shadow-2xl">
      <p className="text-muted-foreground text-xs mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold" style={{ color: p.color }}>{formatBRL(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Cashflow() {
  const { transacoes, loading } = useData()
  const [periodo, setPeriodo] = useState('mes')

  const { chartData, tableTransacoes, avgReceita, avgDespesa } = useMemo(() => {
    const now = new Date()
    const currentMonth = format(now, 'yyyy-MM')

    let chart = []
    if (periodo === 'mes') {
      chart = Array.from({ length: 7 }, (_, i) => {
        const date = subMonths(now, 6 - i)
        const key = format(date, 'yyyy-MM')
        const label = format(date, 'MMM yy', { locale: ptBR })
        const mt = transacoes.filter(t => t.data?.startsWith(key))
        const r = mt.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
        const d = mt.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
        return { periodo: label, receita: r, despesa: d, liquido: r - d }
      })
    } else if (periodo === 'trimestre') {
      chart = Array.from({ length: 4 }, (_, i) => {
        const end = subQuarters(now, 3 - i)
        const months = [0, 1, 2].map(m => format(subMonths(end, 2 - m), 'yyyy-MM'))
        let r = 0, d = 0
        months.forEach(key => {
          const mt = transacoes.filter(t => t.data?.startsWith(key))
          r += mt.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
          d += mt.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
        })
        return { periodo: `T${4 - (3 - i)} ${format(end, 'yy')}`, receita: r, despesa: d, liquido: r - d }
      })
    } else {
      chart = Array.from({ length: 2 }, (_, i) => {
        const year = now.getFullYear() - (1 - i)
        const mt = transacoes.filter(t => t.data?.startsWith(String(year)))
        const r = mt.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
        const d = mt.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
        return { periodo: String(year), receita: r, despesa: d, liquido: r - d }
      })
    }

    const table = periodo === 'mes'
      ? transacoes.filter(t => t.data?.startsWith(currentMonth))
      : periodo === 'trimestre'
      ? transacoes.filter(t => [0, 1, 2].map(i => format(subMonths(now, i), 'yyyy-MM')).includes(t.data?.substring(0, 7)))
      : transacoes

    const last3 = Array.from({ length: 3 }, (_, i) => {
      const key = format(subMonths(now, i + 1), 'yyyy-MM')
      const mt = transacoes.filter(t => t.data?.startsWith(key))
      return {
        receita: mt.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0),
        despesa: mt.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0),
      }
    })

    return {
      chartData: chart,
      tableTransacoes: [...table].sort((a, b) => (b.data || '').localeCompare(a.data || '')),
      avgReceita: last3.reduce((s, m) => s + m.receita, 0) / 3,
      avgDespesa: last3.reduce((s, m) => s + m.despesa, 0) / 3,
    }
  }, [transacoes, periodo])

  if (loading) return (
    <div className="space-y-6">
      <SkeletonChart />
      <SkeletonTable rows={8} />
      <SkeletonCard />
    </div>
  )

  const liquidoProjetado = avgReceita - avgDespesa

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Receitas, despesas e saldo líquido por período</p>
        </div>
      </div>

      {/* Period Selector - Pill tabs */}
      <div className="inline-flex items-center gap-1 bg-secondary/50 rounded-xl p-1 border border-border">
        {Object.entries(PERIODO_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriodo(key)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
              periodo === key
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base text-foreground font-semibold">Receita vs Despesa</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/80 inline-block" />Receita
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500/80 inline-block" />Despesa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-indigo-500 inline-block" />Líquido
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                <XAxis
                  dataKey="periodo"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="receita" name="Receita" fill="#22c55e" fillOpacity={0.85} radius={[5, 5, 0, 0]} barSize={22} />
                <Bar dataKey="despesa" name="Despesa" fill="#ef4444" fillOpacity={0.85} radius={[5, 5, 0, 0]} barSize={22} />
                <Line
                  type="monotone"
                  dataKey="liquido"
                  name="Líquido"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground font-semibold">Lançamentos</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {tableTransacoes.length} registros
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide pl-6">Data</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Descrição</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Categoria</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Conta</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wide text-right pr-6">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableTransacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      Nenhum lançamento no período
                    </TableCell>
                  </TableRow>
                ) : (
                  tableTransacoes.slice(0, 15).map((t, i) => (
                    <TableRow
                      key={t.id || i}
                      className={cn(
                        'border-border transition-colors',
                        i % 2 === 0 ? 'bg-transparent' : 'bg-accent/20',
                        'hover:bg-accent/50'
                      )}
                    >
                      <TableCell className="text-muted-foreground text-sm pl-6 whitespace-nowrap">
                        {t.data ? format(parseISO(t.data), 'dd/MM/yy') : '-'}
                      </TableCell>
                      <TableCell className="text-foreground text-sm font-medium max-w-[200px] truncate">
                        {t.descricao}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{t.categoria}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{t.conta}</TableCell>
                      <TableCell className={cn(
                        'text-right text-sm font-semibold pr-6 whitespace-nowrap tabular-nums',
                        t.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {t.tipo === 'receita' ? '+' : '-'}{formatBRL(t.valor)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Projection Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Calculator size={18} className="text-indigo-400" variant="Bold" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground font-semibold">Projeção 30 Dias</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Baseado na média dos últimos 3 meses</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <MoneyRecive size={14} className="text-emerald-400" variant="Bold" />
                <p className="text-xs text-emerald-400 font-medium">Receita Projetada</p>
              </div>
              <p className="text-xl font-bold text-emerald-400 tabular-nums">{formatBRL(avgReceita)}</p>
            </div>
            <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <MoneySend size={14} className="text-red-400" variant="Bold" />
                <p className="text-xs text-red-400 font-medium">Despesa Projetada</p>
              </div>
              <p className="text-xl font-bold text-red-400 tabular-nums">{formatBRL(avgDespesa)}</p>
            </div>
            <div className={cn(
              'rounded-xl p-4 text-center border',
              liquidoProjetado >= 0
                ? 'bg-indigo-500/5 border-indigo-500/15'
                : 'bg-red-500/5 border-red-500/15'
            )}>
              <div className={cn('flex items-center justify-center gap-1.5 mb-2', liquidoProjetado >= 0 ? 'text-indigo-400' : 'text-red-400')}>
                {liquidoProjetado >= 0
                  ? <TrendUp size={14} variant="Bold" />
                  : <TrendDown size={14} variant="Bold" />}
                <p className="text-xs font-medium">Líquido Projetado</p>
              </div>
              <p className={cn('text-xl font-bold tabular-nums', liquidoProjetado >= 0 ? 'text-indigo-400' : 'text-red-400')}>
                {formatBRL(liquidoProjetado)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
