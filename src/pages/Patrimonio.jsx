import { useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { SkeletonCard, SkeletonChart, SkeletonTable } from '@/components/Skeleton'
import { TrendUp, TrendDown } from 'iconsax-react'
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['#6366f1', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
const TYPE_COLORS = { 'Renda Fixa': '#22c55e', 'Ações': '#6366f1', 'FIIs': '#eab308', 'Crypto': '#f97316' }

export default function Patrimonio() {
  const { ativos, loading } = useData()

  const computed = useMemo(() => {
    const total = ativos.reduce((s, a) => s + Number(a.valor), 0)
    const byType = {}
    ativos.forEach(a => {
      if (!byType[a.tipo]) byType[a.tipo] = { valor: 0, count: 0 }
      byType[a.tipo].valor += Number(a.valor)
      byType[a.tipo].count++
    })
    const alocPie = Object.entries(byType).map(([name, d]) => ({ name, value: d.valor, pct: (d.valor / total * 100).toFixed(1) }))
    const avgReturn = ativos.reduce((s, a) => s + Number(a.valor) * Number(a.rendimento_mes) / 100, 0) / total * 100
    const evolucao = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i)
      return { mes: format(date, 'MMM yy', { locale: ptBR }), valor: Math.round(total * Math.pow(1 + avgReturn / 100, i - 11)) }
    })
    return { total, byType, alocPie, evolucao }
  }, [ativos])

  if (loading) return <div className="space-y-6"><SkeletonChart /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div><SkeletonTable rows={8} /></div>

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null
    return <div className="bg-accent border border-zinc-700 rounded-lg p-3 shadow-xl"><p className="text-muted-foreground text-xs mb-1">{label}</p>{payload.map((p, i) => <p key={i} className="text-sm" style={{ color: p.color }}>{formatBRL(p.value)}</p>)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Patrimônio</h1>
        <div className="text-right"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold text-foreground">{formatBRL(computed.total)}</p></div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Evolução do Patrimônio (12 meses)</CardTitle></CardHeader>
        <CardContent><div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={computed.evolucao}>
              <defs><linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="mes" stroke="#71717a" tick={{ fontSize: 12 }} />
              <YAxis stroke="#71717a" tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="valor" stroke="#6366f1" fill="url(#gP)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div></CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(computed.byType).map(([type, data], i) => (
          <Card key={type} className="bg-card border-border hover:border-border transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] || COLORS[i] }} /><span className="text-xs text-muted-foreground">{type}</span></div>
              <p className="text-lg font-bold text-foreground">{formatBRL(data.valor)}</p>
              <p className="text-xs text-foreground0">{(data.valor / computed.total * 100).toFixed(1)}% do total</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Alocação</CardTitle></CardHeader>
          <CardContent><div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={computed.alocPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, pct }) => `${name} ${pct}%`} labelLine={false}>
                {computed.alocPie.map((e, i) => <Cell key={i} fill={TYPE_COLORS[e.name] || COLORS[i]} />)}
              </Pie><Tooltip formatter={v => formatBRL(v)} contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: 8 }} /></PieChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Ativos</CardTitle></CardHeader>
          <CardContent><div className="overflow-x-auto">
            <Table><TableHeader><TableRow className="border-border">
              <TableHead className="text-muted-foreground">Nome</TableHead><TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground text-right">Valor</TableHead><TableHead className="text-muted-foreground text-right">%</TableHead>
              <TableHead className="text-muted-foreground text-right">Mês</TableHead><TableHead className="text-muted-foreground text-right">Acum.</TableHead>
            </TableRow></TableHeader><TableBody>
              {[...ativos].sort((a, b) => Number(b.valor) - Number(a.valor)).map((a, i) => (
                <TableRow key={a.id || i} className="border-border hover:bg-accent/50">
                  <TableCell className="text-foreground text-sm font-medium">{a.nome}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{a.tipo}</Badge></TableCell>
                  <TableCell className="text-foreground text-sm text-right">{formatBRL(a.valor)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm text-right">{(Number(a.valor) / computed.total * 100).toFixed(1)}%</TableCell>
                  <TableCell className={`text-sm text-right ${Number(a.rendimento_mes) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="flex items-center justify-end gap-1">{Number(a.rendimento_mes) >= 0 ? <TrendUp size={12} variant="Bold" /> : <TrendDown size={12} variant="Bold" />}{Number(a.rendimento_mes).toFixed(1)}%</div>
                  </TableCell>
                  <TableCell className={`text-sm text-right ${Number(a.rendimento_acumulado) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{Number(a.rendimento_acumulado).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </div></CardContent>
        </Card>
      </div>
    </div>
  )
}
