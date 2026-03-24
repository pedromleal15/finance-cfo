import { useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/Skeleton'
import {
  Lamp, TrendUp, TrendDown, Danger, InfoCircle, TickCircle,
  Warning2, Chart21, MoneyRecive, Flag,
} from 'iconsax-react'
import { format, subMonths, parseISO, differenceInDays } from 'date-fns'

const TYPE_CONFIG = {
  danger: {
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    borderLeft: 'border-l-red-500',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    badgeVariant: 'danger',
    label: 'Critico',
    impactColor: 'text-red-400',
  },
  warning: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    borderLeft: 'border-l-amber-500',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    badgeVariant: 'warning',
    label: 'Atencao',
    impactColor: 'text-amber-400',
  },
  info: {
    bg: 'bg-indigo-500/5',
    border: 'border-indigo-500/20',
    borderLeft: 'border-l-indigo-500',
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-400',
    badgeVariant: 'default',
    label: 'Info',
    impactColor: 'text-indigo-400',
  },
  success: {
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
    borderLeft: 'border-l-emerald-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    badgeVariant: 'success',
    label: 'Positivo',
    impactColor: 'text-emerald-400',
  },
}

const PRIORITY_ORDER = { danger: 0, warning: 1, info: 2, success: 3 }

export default function Insights() {
  const { transacoes, metas, orcamentos, loading } = useData()

  const insights = useMemo(() => {
    const now = new Date()
    const currentMonth = format(now, 'yyyy-MM')
    const monthT = transacoes.filter(t => t.data?.startsWith(currentMonth))
    const receitaMes = monthT.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
    const despesaMes = monthT.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)

    const prev3 = [1, 2, 3].map(i => format(subMonths(now, i), 'yyyy-MM'))
    const avgByCat = {}
    transacoes
      .filter(t => prev3.some(m => t.data?.startsWith(m)) && t.tipo === 'despesa')
      .forEach(t => { avgByCat[t.categoria] = (avgByCat[t.categoria] || 0) + Number(t.valor) })
    Object.keys(avgByCat).forEach(k => { avgByCat[k] /= 3 })

    const currByCat = {}
    monthT.filter(t => t.tipo === 'despesa').forEach(t => {
      currByCat[t.categoria] = (currByCat[t.categoria] || 0) + Number(t.valor)
    })

    const list = []

    Object.entries(currByCat).forEach(([cat, val]) => {
      const avg = avgByCat[cat] || 0
      if (avg > 0) {
        const v = ((val - avg) / avg) * 100
        if (v > 20) {
          list.push({
            type: 'warning',
            icon: TrendUp,
            title: `${cat}: gasto ${v.toFixed(0)}% acima da média`,
            description: `Você gastou ${formatBRL(val)} em ${cat}, média foi ${formatBRL(avg)}.`,
            action: `Revise gastos com ${cat}.`,
            impact: formatBRL(val - avg),
          })
        } else if (v < -20) {
          list.push({
            type: 'success',
            icon: TrendDown,
            title: `${cat}: economia de ${Math.abs(v).toFixed(0)}%`,
            description: `Gastos com ${cat} caíram para ${formatBRL(val)}, abaixo da média de ${formatBRL(avg)}.`,
            action: 'Continue assim.',
            impact: formatBRL(Math.abs(val - avg)),
          })
        }
      }
    })

    const tp = receitaMes > 0 ? ((receitaMes - despesaMes) / receitaMes * 100) : 0
    if (tp < 20) {
      list.push({
        type: 'danger',
        icon: MoneyRecive,
        title: `Taxa de poupança em ${tp.toFixed(1)}%`,
        description: `Benchmark: 20%. Você está ${(20 - tp).toFixed(1)}pp abaixo.`,
        action: `Economize mais ${formatBRL(receitaMes * 0.2 - (receitaMes - despesaMes))}/mês.`,
        impact: formatBRL(receitaMes * 0.2 - (receitaMes - despesaMes)),
      })
    } else {
      list.push({
        type: 'success',
        icon: MoneyRecive,
        title: `Taxa de poupança saudável: ${tp.toFixed(1)}%`,
        description: 'Acima do benchmark de 20%.',
        action: 'Direcione excedente para investimentos.',
        impact: formatBRL(receitaMes - despesaMes),
      })
    }

    const budgetCats = orcamentos.map(o => o.categoria)
    const unbudgeted = Object.keys(currByCat).filter(c => !budgetCats.includes(c))
    if (unbudgeted.length > 0) {
      list.push({
        type: 'info',
        icon: Chart21,
        title: `${unbudgeted.length} categoria${unbudgeted.length !== 1 ? 's' : ''} sem orçamento`,
        description: `${unbudgeted.join(', ')} não possuem limite definido.`,
        action: 'Defina limites para controle total.',
        impact: formatBRL(unbudgeted.reduce((s, c) => s + (currByCat[c] || 0), 0)),
      })
    }

    metas.forEach(meta => {
      if (!meta.prazo || meta.status === 'concluida') return
      const diasTotal = differenceInDays(parseISO(meta.prazo), parseISO(meta.created_at || meta.prazo))
      const diasPassados = differenceInDays(now, parseISO(meta.created_at || meta.prazo))
      const esperado = diasTotal > 0 ? (diasPassados / diasTotal * 100) : 100
      const real = Number(meta.valor_meta) > 0 ? (Number(meta.valor_atual) / Number(meta.valor_meta) * 100) : 0
      if (real < esperado - 10 && esperado > 20) {
        const deficit = Number(meta.valor_meta) * (esperado / 100) - Number(meta.valor_atual)
        list.push({
          type: 'warning',
          icon: Flag,
          title: `Meta "${meta.nome}" abaixo do esperado`,
          description: `Real: ${real.toFixed(0)}% vs esperado: ${esperado.toFixed(0)}%.`,
          action: 'Aumente contribuição mensal.',
          impact: formatBRL(Math.max(0, deficit)),
        })
      }
    })

    orcamentos.forEach(orc => {
      const pct = Number(orc.limite) > 0 ? (Number(orc.gasto_atual) / Number(orc.limite) * 100) : 0
      if (pct >= 100) {
        list.push({
          type: 'danger',
          icon: Danger,
          title: `${orc.categoria}: orçamento estourado`,
          description: `${formatBRL(orc.gasto_atual)} excedeu o limite de ${formatBRL(orc.limite)}.`,
          action: `Reduza gastos com ${orc.categoria}.`,
          impact: formatBRL(Number(orc.gasto_atual) - Number(orc.limite)),
        })
      } else if (pct >= 80) {
        list.push({
          type: 'warning',
          icon: Warning2,
          title: `${orc.categoria}: ${pct.toFixed(0)}% do orçamento utilizado`,
          description: `Restam apenas ${formatBRL(Number(orc.limite) - Number(orc.gasto_atual))}.`,
          action: 'Controle os gastos restantes nesta categoria.',
          impact: formatBRL(Number(orc.limite) - Number(orc.gasto_atual)),
        })
      }
    })

    list.sort((a, b) => (PRIORITY_ORDER[a.type] ?? 4) - (PRIORITY_ORDER[b.type] ?? 4))
    return list
  }, [transacoes, metas, orcamentos])

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
    </div>
  )

  const counts = {
    danger: insights.filter(i => i.type === 'danger').length,
    warning: insights.filter(i => i.type === 'warning').length,
    success: insights.filter(i => i.type === 'success').length,
    info: insights.filter(i => i.type === 'info').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Lamp size={20} className="text-indigo-400" variant="Bold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Insights CFO</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {insights.length} insight{insights.length !== 1 ? 's' : ''} gerado{insights.length !== 1 ? 's' : ''} a partir dos seus dados
            </p>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {counts.danger > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <Danger size={12} className="text-red-400" variant="Bold" />
            <span className="text-xs font-semibold text-red-400">{counts.danger} critico{counts.danger !== 1 ? 's' : ''}</span>
          </div>
        )}
        {counts.warning > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Warning2 size={12} className="text-amber-400" variant="Bold" />
            <span className="text-xs font-semibold text-amber-400">{counts.warning} alerta{counts.warning !== 1 ? 's' : ''}</span>
          </div>
        )}
        {counts.info > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <InfoCircle size={12} className="text-indigo-400" variant="Bold" />
            <span className="text-xs font-semibold text-indigo-400">{counts.info} informativo{counts.info !== 1 ? 's' : ''}</span>
          </div>
        )}
        {counts.success > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <TickCircle size={12} className="text-emerald-400" variant="Bold" />
            <span className="text-xs font-semibold text-emerald-400">{counts.success} positivo{counts.success !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Insight Cards */}
      <div className="space-y-3">
        {insights.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-16 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TickCircle size={24} className="text-emerald-400" variant="Bold" />
              </div>
              <p className="text-sm font-medium text-foreground">Tudo sob controle</p>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Sem insights relevantes no momento. Continue monitorando suas finanças.
              </p>
            </CardContent>
          </Card>
        ) : (
          insights.map((ins, i) => {
            const cfg = TYPE_CONFIG[ins.type] || TYPE_CONFIG.info
            return (
              <Card
                key={i}
                className={cn(
                  'border border-l-4 transition-all duration-200 hover:shadow-md',
                  cfg.bg,
                  cfg.border,
                  cfg.borderLeft
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.iconBg)}>
                      <ins.icon size={20} className={cfg.iconColor} variant="Bold" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground leading-snug flex-1">{ins.title}</h3>
                        <Badge variant={cfg.badgeVariant} className="text-xs flex-shrink-0">
                          {cfg.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{ins.description}</p>

                      {/* Action + Impact row */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-3 border-t border-current/10">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-0.5 flex-shrink-0">Acao</span>
                          <span className="text-xs text-foreground/80 leading-relaxed">{ins.action}</span>
                        </div>
                        {ins.impact && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Impacto</span>
                            <span className={cn('text-sm font-bold tabular-nums', cfg.impactColor)}>
                              {ins.impact}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
