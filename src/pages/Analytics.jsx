import { useState, useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { SkeletonChart, SkeletonTable } from '@/components/Skeleton'
import { TrendUp, TrendDown } from 'iconsax-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#f43f5e']

export default function Analytics() {
  const { transacoes, loading } = useData()
  const [activeTab, setActiveTab] = useState('receitas')

  const computed = useMemo(() => {
    const now = new Date()
    const currentMonth = format(now, 'yyyy-MM')
    const monthT = transacoes.filter(t => t.data?.startsWith(currentMonth))

    const recByCat = {}
    monthT.filter(t => t.tipo === 'receita').forEach(t => { recByCat[t.categoria] = (recByCat[t.categoria] || 0) + Number(t.valor) })
    const receitasPie = Object.entries(recByCat).map(([name, value]) => ({ name, value }))
    const totalReceitas = receitasPie.reduce((s, r) => s + r.value, 0)

    const despByCat = {}
    monthT.filter(t => t.tipo === 'despesa').forEach(t => { despByCat[t.categoria] = (despByCat[t.categoria] || 0) + Number(t.valor) })
    const despesasPie = Object.entries(despByCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const totalDespesas = despesasPie.reduce((s, r) => s + r.value, 0)

    const fixas = ['Moradia', 'Saúde', 'Assinaturas']
    const despFixas = despesasPie.filter(d => fixas.includes(d.name)).reduce((s, d) => s + d.value, 0)
    const fixasVarPie = [{ name: 'Fixas', value: despFixas }, { name: 'Variáveis', value: totalDespesas - despFixas }]

    const despMensais = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i)
      const key = format(date, 'yyyy-MM')
      return { mes: format(date, 'MMM', { locale: ptBR }), total: transacoes.filter(t => t.data?.startsWith(key) && t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0) }
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

  if (loading) return <div className="space-y-6"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><SkeletonChart /><SkeletonTable rows={6} /></div></div>

  const renderPieLabel = ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Análise Financeira</h1>
      <div className="flex gap-2">
        {['receitas','despesas','comparativo'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-indigo-500/20 text-indigo-400' : 'text-muted-foreground hover:bg-accent'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'receitas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Receitas por Fonte</CardTitle></CardHeader>
            <CardContent><div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={computed.receitasPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={renderPieLabel} labelLine={false}>
                  {computed.receitasPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip formatter={v => formatBRL(v)} contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: 8 }} /></PieChart>
              </ResponsiveContainer>
            </div></CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Detalhamento</CardTitle></CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow className="border-border">
                <TableHead className="text-muted-foreground">Fonte</TableHead><TableHead className="text-muted-foreground text-right">Valor</TableHead><TableHead className="text-muted-foreground text-right">%</TableHead>
              </TableRow></TableHeader><TableBody>
                {computed.receitasPie.map((r, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-foreground text-sm flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{r.name}</TableCell>
                    <TableCell className="text-green-400 text-sm text-right">{formatBRL(r.value)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm text-right">{(r.value / computed.totalReceitas * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'despesas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Fixas vs Variáveis</CardTitle></CardHeader>
              <CardContent><div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={computed.fixasVarPie} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={renderPieLabel} labelLine={false}>
                    <Cell fill="#6366f1" /><Cell fill="#eab308" />
                  </Pie><Tooltip formatter={v => formatBRL(v)} contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: 8 }} /></PieChart>
                </ResponsiveContainer>
              </div></CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Ranking por Categoria</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {computed.despesasPie.map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1"><span className="text-foreground/80">{d.name}</span><span className="text-muted-foreground">{formatBRL(d.value)}</span></div>
                    <Progress value={(d.value / computed.totalDespesas) * 100} indicatorClassName="bg-indigo-500" className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Evolução de Despesas (6 meses)</CardTitle></CardHeader>
            <CardContent><div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={computed.despMensais}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="mes" stroke="#71717a" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => formatBRL(v)} contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="total" name="Despesas" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div></CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'comparativo' && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Comparativo Mensal</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow className="border-border">
              <TableHead className="text-muted-foreground">Mês</TableHead><TableHead className="text-muted-foreground text-right">Receita</TableHead>
              <TableHead className="text-muted-foreground text-right">Despesa</TableHead><TableHead className="text-muted-foreground text-right">Variação</TableHead>
            </TableRow></TableHeader><TableBody>
              {computed.comparativo.map((row, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell className="text-foreground text-sm capitalize">{row.mes}</TableCell>
                  <TableCell className="text-green-400 text-sm text-right">{formatBRL(row.receita)}</TableCell>
                  <TableCell className="text-red-400 text-sm text-right">{formatBRL(row.despesa)}</TableCell>
                  <TableCell className="text-right">
                    <div className={`inline-flex items-center gap-1 text-sm ${row.variacao >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {row.variacao >= 0 ? <TrendUp size={14} variant="Bold" /> : <TrendDown size={14} variant="Bold" />}
                      {formatBRL(Math.abs(row.variacao))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
