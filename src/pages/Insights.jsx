import { useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/Skeleton'
import { Lamp, TrendUp, TrendDown, Danger, InfoCircle, TickCircle, Warning2, Chart21, MoneyRecive, Flag } from 'iconsax-react'
import { format, subMonths, parseISO, differenceInDays } from 'date-fns'

export default function Insights() {
  const { transacoes, metas, orcamentos, loading } = useData()

  const insights = useMemo(() => {
    const now = new Date()
    const currentMonth = format(now, 'yyyy-MM')
    const monthT = transacoes.filter(t => t.data?.startsWith(currentMonth))
    const receitaMes = monthT.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
    const despesaMes = monthT.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)

    const prev3 = [1,2,3].map(i => format(subMonths(now, i), 'yyyy-MM'))
    const avgByCat = {}
    transacoes.filter(t => prev3.some(m => t.data?.startsWith(m)) && t.tipo === 'despesa').forEach(t => { avgByCat[t.categoria] = (avgByCat[t.categoria] || 0) + Number(t.valor) })
    Object.keys(avgByCat).forEach(k => { avgByCat[k] /= 3 })

    const currByCat = {}
    monthT.filter(t => t.tipo === 'despesa').forEach(t => { currByCat[t.categoria] = (currByCat[t.categoria] || 0) + Number(t.valor) })

    const list = []

    Object.entries(currByCat).forEach(([cat, val]) => {
      const avg = avgByCat[cat] || 0
      if (avg > 0) {
        const v = ((val - avg) / avg) * 100
        if (v > 20) list.push({ type: 'warning', icon: TrendUp, title: `${cat}: gasto ${v.toFixed(0)}% acima da média`, description: `Você gastou ${formatBRL(val)} em ${cat}, média foi ${formatBRL(avg)}.`, action: `Revise gastos com ${cat}.`, impact: formatBRL(val - avg) })
        else if (v < -20) list.push({ type: 'success', icon: TrendDown, title: `${cat}: economia de ${Math.abs(v).toFixed(0)}%`, description: `Gastos com ${cat} caíram para ${formatBRL(val)}, abaixo da média de ${formatBRL(avg)}.`, action: 'Continue assim.', impact: formatBRL(Math.abs(val - avg)) })
      }
    })

    const tp = receitaMes > 0 ? ((receitaMes - despesaMes) / receitaMes * 100) : 0
    if (tp < 20) list.push({ type: 'danger', icon: MoneyRecive, title: `Taxa de poupança em ${tp.toFixed(1)}%`, description: `Benchmark: 20%. Você está ${(20-tp).toFixed(1)}pp abaixo.`, action: `Economize mais ${formatBRL(receitaMes*0.2-(receitaMes-despesaMes))}/mês.`, impact: formatBRL(receitaMes*0.2-(receitaMes-despesaMes)) })
    else list.push({ type: 'success', icon: MoneyRecive, title: `Taxa de poupança saudável: ${tp.toFixed(1)}%`, description: 'Acima do benchmark de 20%.', action: 'Direcione excedente para investimentos.', impact: formatBRL(receitaMes - despesaMes) })

    const budgetCats = orcamentos.map(o => o.categoria)
    const unbudgeted = Object.keys(currByCat).filter(c => !budgetCats.includes(c))
    if (unbudgeted.length > 0) list.push({ type: 'info', icon: Chart21, title: `${unbudgeted.length} categoria(s) sem orçamento`, description: `${unbudgeted.join(', ')} não possuem limite.`, action: 'Defina limites para controle total.', impact: formatBRL(unbudgeted.reduce((s, c) => s + (currByCat[c]||0), 0)) })

    metas.forEach(meta => {
      if (!meta.prazo || meta.status === 'concluida') return
      const diasTotal = differenceInDays(parseISO(meta.prazo), parseISO(meta.created_at || meta.prazo))
      const diasPassados = differenceInDays(now, parseISO(meta.created_at || meta.prazo))
      const esperado = diasTotal > 0 ? (diasPassados / diasTotal * 100) : 100
      const real = Number(meta.valor_meta) > 0 ? (Number(meta.valor_atual) / Number(meta.valor_meta) * 100) : 0
      if (real < esperado - 10 && esperado > 20) {
        const deficit = Number(meta.valor_meta) * (esperado/100) - Number(meta.valor_atual)
        list.push({ type: 'warning', icon: Flag, title: `Meta "${meta.nome}" abaixo do esperado`, description: `Real: ${real.toFixed(0)}% vs esperado: ${esperado.toFixed(0)}%.`, action: 'Aumente contribuição mensal.', impact: formatBRL(Math.max(0, deficit)) })
      }
    })

    orcamentos.forEach(orc => {
      const pct = Number(orc.limite) > 0 ? (Number(orc.gasto_atual) / Number(orc.limite) * 100) : 0
      if (pct >= 100) list.push({ type: 'danger', icon: Danger, title: `${orc.categoria}: orçamento estourado`, description: `${formatBRL(orc.gasto_atual)} excedeu ${formatBRL(orc.limite)}.`, action: `Reduza gastos com ${orc.categoria}.`, impact: formatBRL(Number(orc.gasto_atual)-Number(orc.limite)) })
      else if (pct >= 80) list.push({ type: 'warning', icon: Warning2, title: `${orc.categoria}: ${pct.toFixed(0)}% do orçamento`, description: `Restam ${formatBRL(Number(orc.limite)-Number(orc.gasto_atual))}.`, action: 'Controle gastos restantes.', impact: formatBRL(Number(orc.limite)-Number(orc.gasto_atual)) })
    })

    const order = { danger: 0, warning: 1, info: 2, success: 3 }
    list.sort((a, b) => (order[a.type]||4) - (order[b.type]||4))
    return list
  }, [transacoes, metas, orcamentos])

  if (loading) return <div className="space-y-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>

  const styles = {
    danger: { bg: 'bg-red-500/5', border: 'border-red-500/20', badge: 'danger', icon: 'text-red-400' },
    warning: { bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', badge: 'warning', icon: 'text-yellow-400' },
    info: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', badge: 'default', icon: 'text-blue-400' },
    success: { bg: 'bg-green-500/5', border: 'border-green-500/20', badge: 'success', icon: 'text-green-400' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><Lamp size={24} className="text-indigo-400" variant="Bold" /><h1 className="text-2xl font-bold text-foreground">Insights CFO</h1></div>
      <p className="text-muted-foreground text-sm">{insights.length} insights gerados a partir dos seus dados.</p>
      <div className="space-y-4">
        {insights.map((ins, i) => {
          const s = styles[ins.type] || styles.info
          return (
            <Card key={i} className={`${s.bg} border ${s.border} hover:border-opacity-40 transition-colors`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}><ins.icon size={20} className={s.icon} variant="Bold" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{ins.title}</h3>
                      <Badge variant={s.badge} className="text-xs">{ins.type === 'danger' ? 'Crítico' : ins.type === 'warning' ? 'Atenção' : ins.type === 'success' ? 'Positivo' : 'Info'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{ins.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-1.5"><span className="text-xs text-foreground0">Ação:</span><span className="text-xs text-foreground/80">{ins.action}</span></div>
                      {ins.impact && <div className="flex items-center gap-1.5"><span className="text-xs text-foreground0">Impacto:</span><span className={`text-xs font-medium ${s.icon}`}>{ins.impact}</span></div>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
