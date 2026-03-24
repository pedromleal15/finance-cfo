import { useState, useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { SkeletonChart, SkeletonTable } from '@/components/Skeleton'
import { TrendUp, TrendDown } from 'iconsax-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Label,
} from 'recharts'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#eab308', '#06b6d4', '#ec4899', '#f97316', '#8b5cf6', '#14b8a6', '#f43f5e']

const TAB_LABELS = { receitas: 'Receitas', despesas: 'Despesas', comparativo: 'Comparativo' }

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-xl p-3 shadow-2xl">
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

const CustomPieLegend = ({ data, total, colorMap }) => (
  <div className="space-y-2 mt-4">
    {data.map((item, i) => {
      const pct = total > 0 ? (item.value / total * 100) : 0
      return (
        <div key={i} className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colorMap ? colorMap[i] : COLORS[i % COLORS.length] }} />
          <span className="text-sm text-muted-foreground flex-1 truncate">{item.name}</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">{formatBRL(item.value)}</span>
          <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{pct.toFixed(1)}%</span>
        </div>
      )
    })}
  </div>
)

export default function Analytics() {
  const { transacoes, loading } = useData()
  const [activeTab, setActiveTab] = useState('receitas')

  const computed = useMemo(() => {
    const now = new Date()
    const currentMonth = format(now, 'yyyy-MM')
    const monthT = transacoes.filter(t => t.data?.startsWith(currentMonth))

    const recByCat = {}
    monthT.filter(t => t.tipo === 'receita').forEach(t => {
      recByCat[t.categoria] = (recByCat[t.categoria] || 0) + Number(t.valor)
    })
    const receitasPie = Object.entries(recByCat).map(([name, value]) => ({ name, value }))
    const totalReceitas = receitasPie.reduce((s, r) => s + r.value, 0)

    const despByCat = {}
    monthT.filter(t => t.tipo === 'despesa').forEach(t => {
      despByCat[t.categoria] = (despByCat[t.categoria] || 0) + Number(t.valor)
    })
    const despesasPie = Object.entries(despByCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    const totalDespesas = despesasPie.reduce((s, r) => s + r.value, 0)

    const fixas = ['Moradia', 'Saúde', 'Assinaturas']
    const despFixas = despesasPie.filter(d => fixas.includes(d.name)).reduce((s, d) => s + d.value, 0)
    const fixasVarPie = [
      { name: 'Fixas', value: despFixas },
      { name: 'Variáveis', value: totalDespesas - despFixas },
    ]

    const despMensais = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i)
      const key = format(date, 'yyyy-MM')
      return {
        mes: format(date, 'MMM', { locale: ptBR }),
        total: transacoes
          .filter(t => t.data?.startsWith(key) && t.tipo === 'despesa')
          .reduce((s, t) => s + Number(t.valor), 0),
      }
    })

    const comparativo = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i)
      const key = format(date, 'yyyy-MM')
      const mt = transacoes.filter(t => t.data?.startsWith(key))
      const r = mt.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
      const d = mt.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
      return { mes: format(date, 'MMM yy', { locale: ptBR }), receita: r, despesa: d, variacao: r - d }
    })

    return { receitasPie, totalReceitas, despesasPie, totalDespesas, fixasVarPie, despMensais, comparativo }
  }, [transacoes])

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonTable rows={6} />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Análise Financeira</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Breakdown detalhado das suas finanças</p>
      </div>

      {/* Pill tabs */}
      <div className="inline-flex items-center gap-1 bg-secondary/50 rounded-xl p-1 border border-border">
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
              activeTab === key
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Receitas Tab */}
      {activeTab === 'receitas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground font-semibold">Receitas por Fonte</CardTitle>
              <p className="text-sm text-muted-foreground">Total: <span className="font-semibold text-emerald-400">{formatBRL(computed.totalReceitas)}</span></p>
            </CardHeader>
            <CardContent>
              {computed.receitasPie.length > 0 ? (
                <>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={computed.receitasPie}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={42}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {computed.receitasPie.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={v => formatBRL(v)}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }}
                          labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <CustomPieLegend data={computed.receitasPie} total={computed.totalReceitas} />
                </>
              ) : (
                <div className="h-52 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Sem receitas no mês atual</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground font-semibold">Detalhamento de Receitas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide pl-6">Fonte</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide text-right">Valor</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide text-right pr-6">Participação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computed.receitasPie.map((r, i) => (
                    <TableRow key={i} className="border-border hover:bg-accent/50">
                      <TableCell className="text-foreground text-sm pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          {r.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-400 text-sm font-semibold text-right tabular-nums">
                        {formatBRL(r.value)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm text-right pr-6 tabular-nums">
                        {computed.totalReceitas > 0 ? (r.value / computed.totalReceitas * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Despesas Tab */}
      {activeTab === 'despesas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="items-center pb-0">
                <CardTitle className="text-base text-foreground font-semibold">Fixas vs Variáveis</CardTitle>
                <p className="text-sm text-muted-foreground">Composição das despesas do mês</p>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                <ChartContainer
                  config={{
                    fixas: { label: "Fixas", color: "#6366f1" },
                    variaveis: { label: "Variáveis", color: "#eab308" },
                  }}
                  className="mx-auto aspect-square max-h-[250px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value) => formatBRL(value)}
                        />
                      }
                    />
                    <Pie
                      data={computed.fixasVarPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                      paddingAngle={3}
                    >
                      <Cell fill="var(--color-fixas)" />
                      <Cell fill="var(--color-variaveis)" />
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={viewBox.cy - 2} className="fill-foreground text-xl font-bold">
                                  {formatBRL(computed.totalDespesas)}
                                </tspan>
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-muted-foreground text-xs">
                                  Total
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                      className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                    />
                  </PieChart>
                </ChartContainer>
                <div className="mt-2 flex flex-col gap-2 text-sm">
                  {computed.fixasVarPie.map((item, i) => {
                    const pct = computed.totalDespesas > 0 ? (item.value / computed.totalDespesas * 100) : 0
                    const colors = ['#6366f1', '#eab308']
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: colors[i] }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground tabular-nums">{formatBRL(item.value)}</span>
                          <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-foreground font-semibold">Ranking por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {computed.despesasPie.map((d, i) => {
                  const pct = computed.totalDespesas > 0 ? (d.value / computed.totalDespesas * 100) : 0
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span className="text-foreground/80">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground tabular-nums">{formatBRL(d.value)}</span>
                          <span className="text-xs font-semibold text-muted-foreground w-10 text-right tabular-nums">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <Progress
                        value={pct}
                        indicatorClassName="bg-indigo-500"
                        className="h-1.5"
                        style={{ '--progress-color': COLORS[i % COLORS.length] }}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground font-semibold">Evolução de Despesas (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={computed.despMensais} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="despLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Despesas"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={{ fill: '#ef4444', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparativo Tab */}
      {activeTab === 'comparativo' && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground font-semibold">Comparativo Mensal (6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide pl-6">Mês</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide text-right">Receita</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide text-right">Despesa</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase font-medium tracking-wide text-right pr-6">Variação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computed.comparativo.map((row, i) => (
                  <TableRow
                    key={i}
                    className={cn(
                      'border-border transition-colors',
                      i % 2 === 0 ? 'bg-transparent' : 'bg-accent/20',
                      'hover:bg-accent/50'
                    )}
                  >
                    <TableCell className="text-foreground text-sm font-medium capitalize pl-6">{row.mes}</TableCell>
                    <TableCell className="text-emerald-400 text-sm font-semibold text-right tabular-nums">
                      {formatBRL(row.receita)}
                    </TableCell>
                    <TableCell className="text-red-400 text-sm font-semibold text-right tabular-nums">
                      {formatBRL(row.despesa)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className={cn(
                        'inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums',
                        row.variacao >= 0 ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {row.variacao >= 0
                          ? <TrendUp size={14} variant="Bold" />
                          : <TrendDown size={14} variant="Bold" />}
                        {formatBRL(Math.abs(row.variacao))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
