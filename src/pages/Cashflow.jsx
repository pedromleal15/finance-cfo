import { useState, useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { SkeletonChart, SkeletonTable, SkeletonCard } from '@/components/Skeleton'
import { Calculator } from 'iconsax-react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format, subMonths, subQuarters, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
        const months = [0,1,2].map(m => format(subMonths(end, 2-m), 'yyyy-MM'))
        let r = 0, d = 0
        months.forEach(key => {
          const mt = transacoes.filter(t => t.data?.startsWith(key))
          r += mt.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
          d += mt.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
        })
        return { periodo: `T${4-(3-i)} ${format(end, 'yy')}`, receita: r, despesa: d, liquido: r - d }
      })
    } else {
      chart = Array.from({ length: 2 }, (_, i) => {
        const year = now.getFullYear() - (1-i)
        const mt = transacoes.filter(t => t.data?.startsWith(String(year)))
        const r = mt.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
        const d = mt.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
        return { periodo: String(year), receita: r, despesa: d, liquido: r - d }
      })
    }

    const table = periodo === 'mes'
      ? transacoes.filter(t => t.data?.startsWith(currentMonth))
      : periodo === 'trimestre'
      ? transacoes.filter(t => [0,1,2].map(i => format(subMonths(now, i), 'yyyy-MM')).includes(t.data?.substring(0,7)))
      : transacoes

    const last3 = Array.from({ length: 3 }, (_, i) => {
      const key = format(subMonths(now, i+1), 'yyyy-MM')
      const mt = transacoes.filter(t => t.data?.startsWith(key))
      return {
        receita: mt.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0),
        despesa: mt.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0),
      }
    })

    return {
      chartData: chart,
      tableTransacoes: [...table].sort((a,b) => (b.data||'').localeCompare(a.data||'')),
      avgReceita: last3.reduce((s, m) => s + m.receita, 0) / 3,
      avgDespesa: last3.reduce((s, m) => s + m.despesa, 0) / 3,
    }
  }, [transacoes, periodo])

  if (loading) return <div className="space-y-6"><SkeletonChart /><SkeletonTable rows={8} /><SkeletonCard /></div>

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null
    return (
      <div className="bg-accent border border-zinc-700 rounded-lg p-3 shadow-xl">
        <p className="text-muted-foreground text-xs mb-2">{label}</p>
        {payload.map((p, i) => <p key={i} className="text-sm" style={{ color: p.color }}>{p.name}: {formatBRL(p.value)}</p>)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa</h1>

      <div className="flex gap-2">
        {['mes','trimestre','ano'].map(p => (
          <button key={p} onClick={() => setPeriodo(p)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${periodo === p ? 'bg-indigo-500/20 text-indigo-400' : 'text-muted-foreground hover:bg-accent'}`}>
            {p === 'mes' ? 'Mês' : p === 'trimestre' ? 'Trimestre' : 'Ano'}
          </button>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Receita vs Despesa</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="periodo" stroke="#71717a" tick={{ fontSize: 12 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
                <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[4,4,0,0]} barSize={24} />
                <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4,4,0,0]} barSize={24} />
                <Line type="monotone" dataKey="liquido" name="Líquido" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Lançamentos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Data</TableHead>
                <TableHead className="text-muted-foreground">Descrição</TableHead>
                <TableHead className="text-muted-foreground">Categoria</TableHead>
                <TableHead className="text-muted-foreground">Conta</TableHead>
                <TableHead className="text-muted-foreground text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableTransacoes.slice(0, 15).map((t, i) => (
                <TableRow key={t.id || i} className="border-border hover:bg-accent/50">
                  <TableCell className="text-foreground/80 text-sm">{t.data ? format(parseISO(t.data), 'dd/MM/yy') : '-'}</TableCell>
                  <TableCell className="text-foreground text-sm">{t.descricao}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{t.categoria}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.conta}</TableCell>
                  <TableCell className={`text-right text-sm font-medium ${t.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.tipo === 'receita' ? '+' : '-'}{formatBRL(t.valor)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calculator size={20} className="text-indigo-400" variant="Bold" />
            <CardTitle className="text-base text-foreground">Projeção 30 Dias</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">Baseado na média dos últimos 3 meses</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-foreground0 mb-1">Receita Projetada</p>
              <p className="text-lg font-semibold text-green-400">{formatBRL(avgReceita)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-foreground0 mb-1">Despesa Projetada</p>
              <p className="text-lg font-semibold text-red-400">{formatBRL(avgDespesa)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-foreground0 mb-1">Líquido Projetado</p>
              <p className={`text-lg font-semibold ${avgReceita - avgDespesa >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>{formatBRL(avgReceita - avgDespesa)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
