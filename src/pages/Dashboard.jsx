import { useMemo, useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
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

const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

export default function Dashboard() {
  const { transacoes, ativos, orcamentos, loading } = useData()

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
    const topCategorias = Object.entries(catGastos).map(([cat, val]) => ({ categoria: cat, valor: val })).sort((a, b) => b.valor - a.valor).slice(0, 6)

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

  const [importOpen, setImportOpen] = useState(false)
  const hasData = transacoes.length > 0

  if (loading || !data) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
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
    { label: 'Patrimônio Líquido', value: data.patrimonioLiquido, icon: WalletMoney, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Saldo Disponível', value: data.saldoDisponivel, icon: StatusUp, color: data.saldoDisponivel >= 0 ? 'text-green-400' : 'text-red-400', bg: data.saldoDisponivel >= 0 ? 'bg-green-500/10' : 'bg-red-500/10' },
    { label: 'Receita do Mês', value: data.receitaMes, icon: MoneyRecive, color: 'text-green-400', bg: 'bg-green-500/10', variation: data.receitaVar },
    { label: 'Despesas do Mês', value: data.despesaMes, icon: MoneySend, color: 'text-red-400', bg: 'bg-red-500/10', variation: data.despesaVar },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null
    return (
      <div className="bg-accent border border-zinc-700 rounded-lg p-3 shadow-xl">
        <p className="text-muted-foreground text-xs mb-2 capitalize">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>{p.name}: {formatBRL(p.value)}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-card border-border hover:border-border transition-colors">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon size={18} className={kpi.color} variant="Bold" />
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">{formatBRL(kpi.value)}</p>
              {kpi.variation !== undefined && (
                <div className={`flex items-center gap-1 mt-2 ${kpi.variation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {kpi.variation >= 0 ? <TrendUp size={14} variant="Bold" /> : <TrendDown size={14} variant="Bold" />}
                  <span className="text-xs font-medium">{Math.abs(kpi.variation).toFixed(1)}%</span>
                  <span className="text-xs text-foreground0">vs mês anterior</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Fluxo de Caixa Mensal</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.cashflowData}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="mes" stroke="#71717a" tick={{ fontSize: 12 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#22c55e" fill="url(#gR)" strokeWidth={2} />
                <Area type="monotone" dataKey="despesa" name="Despesa" stroke="#ef4444" fill="url(#gD)" strokeWidth={2} />
                <Area type="monotone" dataKey="liquido" name="Líquido" stroke="#6366f1" fill="url(#gL)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-foreground">Saúde Financeira</CardTitle>
              <div className="flex items-center gap-2">
                <ShieldTick size={20} className={data.healthScore >= 75 ? 'text-green-400' : data.healthScore >= 50 ? 'text-yellow-400' : 'text-red-400'} variant="Bold" />
                <span className={`text-2xl font-bold ${data.healthScore >= 75 ? 'text-green-400' : data.healthScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{data.healthScore}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Taxa de Poupança', value: data.taxaPoupanca, target: 20, suffix: '%' },
              { label: 'Índice de Liquidez', value: data.indiceLiquidez * 100, target: 100 },
              { label: 'Comprometimento de Renda', value: data.comprometimentoRenda, target: 70, suffix: '%', invert: true },
              { label: 'Reserva de Emergência', value: data.reservaEmergencia, target: 6, suffix: ' meses', raw: true },
            ].map((item, i) => {
              const pct = item.raw ? Math.min((item.value / item.target) * 100, 100) : Math.min(item.value, 100)
              const isGood = item.invert ? item.value <= item.target : item.value >= item.target
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={isGood ? 'text-green-400' : 'text-yellow-400'}>{item.raw ? item.value.toFixed(1) : item.value.toFixed(1)}{item.suffix || ''}</span>
                  </div>
                  <Progress value={pct} indicatorClassName={isGood ? 'bg-green-500' : 'bg-yellow-500'} />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Alertas CFO</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.alerts.map((alert, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.type === 'danger' ? 'bg-red-500/5 border border-red-500/20' :
                  alert.type === 'warning' ? 'bg-yellow-500/5 border border-yellow-500/20' :
                  'bg-green-500/5 border border-green-500/20'
                }`}>
                  {alert.type === 'danger' ? <Danger size={18} className="text-red-400 mt-0.5 flex-shrink-0" variant="Bold" /> :
                   alert.type === 'warning' ? <InfoCircle size={18} className="text-yellow-400 mt-0.5 flex-shrink-0" variant="Bold" /> :
                   <TickCircle size={18} className="text-green-400 mt-0.5 flex-shrink-0" variant="Bold" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.desc}</p>
                  </div>
                  <Badge variant={alert.type === 'danger' ? 'danger' : alert.type === 'warning' ? 'warning' : 'success'} className="ml-auto flex-shrink-0">
                    {alert.type === 'danger' ? 'Alto' : alert.type === 'warning' ? 'Médio' : 'OK'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Top Categorias de Gasto</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topCategorias} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" stroke="#71717a" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="categoria" stroke="#71717a" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="valor" name="Gasto" radius={[0, 4, 4, 0]} barSize={16}>
                      {data.topCategorias.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
