import { useMemo, useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/EmptyState'
import { ImportDialog } from '@/components/ImportDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SkeletonCard, SkeletonChart } from '@/components/Skeleton'
import {
  WalletMoney,
  MoneyRecive,
  MoneySend,
  StatusUp,
  TrendUp,
  TrendDown,
  Danger,
  InfoCircle,
  TickCircle,
  ShieldTick,
} from 'iconsax-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#eab308', '#06b6d4', '#ec4899', '#f97316']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-xl p-3 shadow-2xl">
      <p className="text-muted-foreground text-xs mb-2 capitalize font-medium">{label}</p>
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

export default function Dashboard() {
  const { transacoes, ativos, orcamentos, loading } = useData()
  const [importOpen, setImportOpen] = useState(false)

  const data = useMemo(() => {
    if (loading) return null
    const now = new Date()
    const currentMonth = format(now, 'yyyy-MM')
    const monthT = transacoes.filter(t => t.data?.startsWith(currentMonth))
    const receitaMes = monthT.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
    const despesaMes = monthT.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
    const saldoDisponivel = receitaMes - despesaMes
    const patrimonioLiquido = ativos.reduce((s, a) => s + Number(a.valor), 0)

    const prevMonth = format(subMonths(now, 1), 'yyyy-MM')
    const prevT = transacoes.filter(t => t.data?.startsWith(prevMonth))
    const prevReceita = prevT.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
    const prevDespesa = prevT.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
    const receitaVar = prevReceita > 0 ? ((receitaMes - prevReceita) / prevReceita * 100) : 0
    const despesaVar = prevDespesa > 0 ? ((despesaMes - prevDespesa) / prevDespesa * 100) : 0

    const cashflowData = Array.from({ length: 7 }, (_, i) => {
      const date = subMonths(now, 6 - i)
      const key = format(date, 'yyyy-MM')
      const label = format(date, 'MMM', { locale: ptBR })
      const mt = transacoes.filter(t => t.data?.startsWith(key))
      const r = mt.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
      const d = mt.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
      return { mes: label, receita: r, despesa: d, liquido: r - d }
    })

    const taxaPoupanca = receitaMes > 0 ? ((receitaMes - despesaMes) / receitaMes * 100) : 0
    const indiceLiquidez = despesaMes > 0 ? (saldoDisponivel / despesaMes) : 0
    const comprometimentoRenda = receitaMes > 0 ? (despesaMes / receitaMes * 100) : 0
    const reservaEmergencia = despesaMes > 0 ? (patrimonioLiquido * 0.15 / despesaMes) : 0

    let healthScore = 0
    healthScore += taxaPoupanca >= 20 ? 25 : taxaPoupanca >= 10 ? 15 : 5
    healthScore += indiceLiquidez >= 1 ? 25 : indiceLiquidez >= 0.5 ? 15 : 5
    healthScore += comprometimentoRenda <= 70 ? 25 : comprometimentoRenda <= 85 ? 15 : 5
    healthScore += reservaEmergencia >= 6 ? 25 : reservaEmergencia >= 3 ? 15 : 5

    const catGastos = {}
    monthT.filter(t => t.tipo === 'despesa').forEach(t => {
      catGastos[t.categoria] = (catGastos[t.categoria] || 0) + Number(t.valor)
    })
    const topCategorias = Object.entries(catGastos)
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6)

    const alerts = []
    if (taxaPoupanca < 20) alerts.push({ type: 'warning', title: 'Taxa de poupança abaixo do ideal', desc: `Sua taxa está em ${taxaPoupanca.toFixed(1)}%. O recomendado é acima de 20%.` })
    const overBudget = orcamentos.filter(o => Number(o.gasto_atual) > Number(o.limite))
    if (overBudget.length > 0) alerts.push({ type: 'danger', title: `${overBudget.length} categoria(s) acima do orçamento`, desc: overBudget.map(o => o.categoria).join(', ') })
    if (despesaVar > 10) alerts.push({ type: 'warning', title: 'Despesas crescendo', desc: `Despesas aumentaram ${despesaVar.toFixed(1)}% vs mês anterior.` })
    if (alerts.length === 0) alerts.push({ type: 'success', title: 'Tudo sob controle', desc: 'Nenhum alerta importante no momento.' })

    return {
      receitaMes, despesaMes, saldoDisponivel, patrimonioLiquido,
      receitaVar, despesaVar, cashflowData,
      taxaPoupanca, indiceLiquidez, comprometimentoRenda, reservaEmergencia,
      healthScore, topCategorias, alerts,
    }
  }, [transacoes, ativos, orcamentos, loading])

  const hasData = transacoes.length > 0

  if (loading || !data) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
      <SkeletonChart />
    </div>
  )

  if (!hasData) return (
    <>
      <EmptyState
        title="Nenhum dado importado"
        description="Importe sua fatura do Nubank ou extrato bancário (.pdf, .csv, .xlsx) para visualizar seu dashboard financeiro."
        onImport={() => setImportOpen(true)}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  )

  const kpis = [
    {
      label: 'Patrimônio Líquido',
      value: data.patrimonioLiquido,
      icon: WalletMoney,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      glow: 'shadow-indigo-500/10',
    },
    {
      label: 'Saldo Disponível',
      value: data.saldoDisponivel,
      icon: StatusUp,
      color: data.saldoDisponivel >= 0 ? 'text-emerald-400' : 'text-red-400',
      bg: data.saldoDisponivel >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      border: data.saldoDisponivel >= 0 ? 'border-emerald-500/20' : 'border-red-500/20',
      glow: data.saldoDisponivel >= 0 ? 'shadow-emerald-500/10' : 'shadow-red-500/10',
    },
    {
      label: 'Receita do Mês',
      value: data.receitaMes,
      icon: MoneyRecive,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/10',
      variation: data.receitaVar,
      variationPositiveIsGood: true,
    },
    {
      label: 'Despesas do Mês',
      value: data.despesaMes,
      icon: MoneySend,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      glow: 'shadow-red-500/10',
      variation: data.despesaVar,
      variationPositiveIsGood: false,
    },
  ]

  const healthColor = data.healthScore >= 75 ? 'text-emerald-400' : data.healthScore >= 50 ? 'text-amber-400' : 'text-red-400'
  const healthBg = data.healthScore >= 75 ? 'bg-emerald-500' : data.healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const isVarGood = kpi.variationPositiveIsGood
            ? (kpi.variation ?? 0) >= 0
            : (kpi.variation ?? 0) <= 0
          return (
            <Card
              key={i}
              className={cn(
                'bg-card border transition-all duration-300 hover:shadow-lg group',
                kpi.border,
                kpi.glow,
                'hover:shadow-xl'
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{kpi.label}</span>
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', kpi.bg)}>
                    <kpi.icon size={18} className={kpi.color} variant="Bold" />
                  </div>
                </div>
                <p className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">{formatBRL(kpi.value)}</p>
                {kpi.variation !== undefined && (
                  <div className={cn(
                    'flex items-center gap-1.5 mt-2.5 text-xs font-medium',
                    isVarGood ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {isVarGood
                      ? <TrendUp size={13} variant="Bold" />
                      : <TrendDown size={13} variant="Bold" />}
                    <span>{Math.abs(kpi.variation).toFixed(1)}%</span>
                    <span className="text-muted-foreground font-normal">vs mês anterior</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Cashflow Chart */}
      <Card className="bg-card border-border hover:border-border/80 transition-colors">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base text-foreground font-semibold">Fluxo de Caixa Mensal</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Receita</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Despesa</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />Líquido</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.cashflowData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#22c55e" fill="url(#gR)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#22c55e' }} />
                <Area type="monotone" dataKey="despesa" name="Despesa" stroke="#ef4444" fill="url(#gD)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
                <Area type="monotone" dataKey="liquido" name="Líquido" stroke="#6366f1" fill="url(#gL)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Score */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-foreground font-semibold">Saúde Financeira</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Score baseado em 4 indicadores</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={cn('text-3xl font-bold tabular-nums', healthColor)}>{data.healthScore}</p>
                  <p className="text-xs text-muted-foreground">/100</p>
                </div>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', data.healthScore >= 75 ? 'bg-emerald-500/10' : data.healthScore >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10')}>
                  <ShieldTick size={22} className={healthColor} variant="Bold" />
                </div>
              </div>
            </div>
            {/* Score bar */}
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', healthBg)}
                  style={{ width: `${data.healthScore}%` }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Taxa de Poupança', value: data.taxaPoupanca, target: 20, suffix: '%', raw: false, invert: false },
              { label: 'Índice de Liquidez', value: data.indiceLiquidez * 100, target: 100, suffix: '', raw: false, invert: false },
              { label: 'Comprometimento de Renda', value: data.comprometimentoRenda, target: 70, suffix: '%', raw: false, invert: true },
              { label: 'Reserva de Emergência', value: data.reservaEmergencia, target: 6, suffix: ' meses', raw: true, invert: false },
            ].map((item, i) => {
              const pct = item.raw
                ? Math.min((item.value / item.target) * 100, 100)
                : Math.min(item.value, 100)
              const isGood = item.invert ? item.value <= item.target : item.value >= item.target
              const displayVal = item.raw ? item.value.toFixed(1) : item.value.toFixed(1)
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={cn('font-semibold tabular-nums', isGood ? 'text-emerald-400' : 'text-amber-400')}>
                      {displayVal}{item.suffix}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    indicatorClassName={isGood ? 'bg-emerald-500' : 'bg-amber-500'}
                    className="h-1.5"
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Alerts */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground font-semibold">Alertas CFO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.alerts.map((alert, i) => {
                const isDanger = alert.type === 'danger'
                const isWarning = alert.type === 'warning'
                const isSuccess = alert.type === 'success'
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-3 p-3.5 rounded-xl border-l-4 transition-colors',
                      isDanger ? 'bg-red-500/5 border-l-red-500 border border-red-500/10' :
                      isWarning ? 'bg-amber-500/5 border-l-amber-500 border border-amber-500/10' :
                      'bg-emerald-500/5 border-l-emerald-500 border border-emerald-500/10'
                    )}
                  >
                    <div className={cn('mt-0.5 flex-shrink-0', isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400')}>
                      {isDanger
                        ? <Danger size={16} variant="Bold" />
                        : isWarning
                        ? <InfoCircle size={16} variant="Bold" />
                        : <TickCircle size={16} variant="Bold" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.desc}</p>
                    </div>
                    <Badge
                      variant={isDanger ? 'danger' : isWarning ? 'warning' : 'success'}
                      className="flex-shrink-0 text-xs"
                    >
                      {isDanger ? 'Alto' : isWarning ? 'Médio' : 'OK'}
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground font-semibold">Top Categorias de Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topCategorias.length > 0 ? (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topCategorias} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="categoria"
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        width={86}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="valor" name="Gasto" radius={[0, 6, 6, 0]} barSize={14}>
                        {data.topCategorias.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.9} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem despesas no mês atual</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
