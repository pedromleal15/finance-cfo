import { useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { SkeletonCard, SkeletonChart, SkeletonTable } from '@/components/Skeleton'
import { TrendUp, TrendDown, Chart, Buildings, BitcoinConvert, Money } from 'iconsax-react'
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['#6366f1', '#22c55e', '#eab308', '#ef4444', '#06b6d4', '#ec4899', '#f97316']
const TYPE_COLORS = {
  'Renda Fixa': '#22c55e',
  'Ações': '#6366f1',
  'FIIs': '#eab308',
  'Crypto': '#f97316',
}
const TYPE_ICONS = {
  'Renda Fixa': Money,
  'Ações': Chart,
  'FIIs': Buildings,
  'Crypto': BitcoinConvert,
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-xl p-3 shadow-2xl">
      <p className="text-muted-foreground text-xs mb-1.5 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="font-semibold text-foreground">{formatBRL(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

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
    const alocPie = Object.entries(byType).map(([name, d]) => ({
      name,
      value: d.valor,
      pct: total > 0 ? (d.valor / total * 100).toFixed(1) : '0.0',
    }))
    const avgReturn = total > 0
      ? ativos.reduce((s, a) => s + Number(a.valor) * Number(a.rendimento_mes) / 100, 0) / total * 100
      : 0
    const evolucao = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i)
      return {
        mes: format(date, 'MMM yy', { locale: ptBR }),
        valor: Math.round(total * Math.pow(1 + avgReturn / 100, i - 11)),
      }
    })
    return { total, byType, alocPie, evolucao }
  }, [ativos])

  if (loading) return (
    <div className="space-y-6">
      <SkeletonChart />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
      <SkeletonTable rows={8} />
    </div>
  )

  const sortedAtivos = [...ativos].sort((a, b) => Number(b.valor) - Number(a.valor))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Patrimônio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Alocação e evolução dos seus ativos</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Total</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{formatBRL(computed.total)}</p>
        </div>
      </div>

      {/* Evolution Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground font-semibold">Evolução do Patrimônio (12 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={computed.evolucao} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gPat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                <XAxis
                  dataKey="mes"
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
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="#6366f1"
                  fill="url(#gPat)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Asset Type Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(computed.byType).map(([type, data], i) => {
          const color = TYPE_COLORS[type] || COLORS[i % COLORS.length]
          const IconComponent = TYPE_ICONS[type] || Chart
          const pct = computed.total > 0 ? (data.valor / computed.total * 100).toFixed(1) : '0.0'
          return (
            <Card
              key={type}
              className="bg-card border-border hover:shadow-lg transition-all duration-200 group"
              style={{ borderColor: `${color}20` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <IconComponent size={18} style={{ color }} variant="Bold" />
                  </div>
                  <span
                    className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-md"
                    style={{ color, backgroundColor: `${color}15` }}
                  >
                    {pct}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">{type}</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{formatBRL(data.valor)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{data.count} ativo{data.count !== 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Allocation + Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Allocation Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground font-semibold">Alocação por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {computed.alocPie.length > 0 ? (
              <>
                <div className="h-52 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={computed.alocPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={88}
                        dataKey="value"
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {computed.alocPie.map((e, i) => (
                          <Cell key={i} fill={TYPE_COLORS[e.name] || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={v => formatBRL(v)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-sm font-bold text-foreground tabular-nums">{formatBRL(computed.total)}</p>
                    </div>
                  </div>
                </div>
                {/* Legend */}
                <div className="space-y-2 mt-4">
                  {computed.alocPie.map((item, i) => {
                    const color = TYPE_COLORS[item.name] || COLORS[i % COLORS.length]
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm text-muted-foreground flex-1">{item.name}</span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">{formatBRL(item.value)}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{item.pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="h-52 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Nenhum ativo cadastrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-foreground font-semibold">Ativos</CardTitle>
              <Badge variant="secondary" className="text-xs">{ativos.length} itens</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide pl-5">Nome</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide">Tipo</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide text-right">Valor</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide text-right">Aloc.</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide text-right">Mês</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide text-right pr-5">Acum.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAtivos.map((a, i) => {
                    const rendMes = Number(a.rendimento_mes)
                    const rendAcum = Number(a.rendimento_acumulado)
                    const alocPct = computed.total > 0 ? (Number(a.valor) / computed.total * 100).toFixed(1) : '0.0'
                    return (
                      <TableRow
                        key={a.id || i}
                        className={cn(
                          'border-border transition-colors',
                          i % 2 === 0 ? 'bg-transparent' : 'bg-accent/20',
                          'hover:bg-accent/50'
                        )}
                      >
                        <TableCell className="text-foreground text-sm font-semibold pl-5 max-w-[100px] truncate">
                          {a.nome}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              color: TYPE_COLORS[a.tipo] || COLORS[0],
                              backgroundColor: `${TYPE_COLORS[a.tipo] || COLORS[0]}18`,
                              borderColor: 'transparent',
                            }}
                          >
                            {a.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground text-sm font-semibold text-right tabular-nums">
                          {formatBRL(a.valor)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs text-right tabular-nums">
                          {alocPct}%
                        </TableCell>
                        <TableCell className={cn('text-sm text-right tabular-nums', rendMes >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          <div className="flex items-center justify-end gap-0.5">
                            {rendMes >= 0 ? <TrendUp size={11} variant="Bold" /> : <TrendDown size={11} variant="Bold" />}
                            {Math.abs(rendMes).toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell className={cn('text-sm text-right pr-5 tabular-nums font-semibold', rendAcum >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {rendAcum >= 0 ? '+' : ''}{rendAcum.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
