import { useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SkeletonCard } from '@/components/Skeleton'
import { Flag, Timer1, TickCircle, Danger, WalletMoney } from 'iconsax-react'
import { format, parseISO, differenceInDays } from 'date-fns'

const STATUS_CONFIG = {
  em_andamento: { label: 'Em andamento', variant: 'default', className: 'bg-indigo-500/15 text-indigo-400 border-transparent' },
  concluida:    { label: 'Concluída',    variant: 'success', className: '' },
  atrasada:     { label: 'Atrasada',     variant: 'danger',  className: '' },
}

const getGoalStatus = (pct, dias) => {
  if (pct >= 100) return 'concluida'
  if (dias !== null && dias < 0) return 'atrasada'
  return 'em_andamento'
}

const getGoalProgressColor = (pct) => {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 50) return 'bg-indigo-500'
  if (pct >= 25) return 'bg-amber-500'
  return 'bg-red-500'
}

const getBudgetColor = (pct) => {
  if (pct >= 100) return { bar: 'bg-red-500', text: 'text-red-400' }
  if (pct >= 90)  return { bar: 'bg-red-500', text: 'text-red-400' }
  if (pct >= 75)  return { bar: 'bg-amber-500', text: 'text-amber-400' }
  return { bar: 'bg-emerald-500', text: 'text-emerald-400' }
}

const CircularProgress = ({ value, size = 72, strokeWidth = 6, color = '#6366f1' }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--secondary))"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

const getCircleColor = (pct) => {
  if (pct >= 80) return '#22c55e'
  if (pct >= 50) return '#6366f1'
  if (pct >= 25) return '#eab308'
  return '#ef4444'
}

export default function Metas() {
  const { metas, orcamentos, loading } = useData()

  const budgetSummary = useMemo(() => {
    const total = orcamentos.reduce((s, o) => s + Number(o.limite), 0)
    const gasto = orcamentos.reduce((s, o) => s + Number(o.gasto_atual), 0)
    const overCount = orcamentos.filter(o => Number(o.gasto_atual) >= Number(o.limite)).length
    return { total, gasto, overCount }
  }, [orcamentos])

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Metas e Orçamentos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Acompanhe seu progresso e controle seus limites</p>
      </div>

      {/* Goals Section */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Flag size={16} className="text-indigo-400" variant="Bold" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Metas Financeiras</h2>
            <p className="text-xs text-muted-foreground">{metas.length} meta{metas.length !== 1 ? 's' : ''} cadastrada{metas.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {metas.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 flex flex-col items-center gap-2">
              <Flag size={32} className="text-muted-foreground/30" variant="Linear" />
              <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metas.map((meta, i) => {
              const pct = Number(meta.valor_meta) > 0
                ? (Number(meta.valor_atual) / Number(meta.valor_meta) * 100)
                : 0
              const dias = meta.prazo ? differenceInDays(parseISO(meta.prazo), new Date()) : null
              const status = getGoalStatus(pct, dias)
              const statusCfg = STATUS_CONFIG[status]
              const circleColor = getCircleColor(pct)
              const remaining = Number(meta.valor_meta) - Number(meta.valor_atual)

              return (
                <Card
                  key={meta.id || i}
                  className={cn(
                    'bg-card border transition-all duration-200 hover:shadow-lg',
                    status === 'concluida' ? 'border-emerald-500/20' :
                    status === 'atrasada' ? 'border-red-500/20' :
                    'border-border'
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Circular progress */}
                      <div className="relative flex-shrink-0">
                        <CircularProgress value={pct} color={circleColor} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold tabular-nums" style={{ color: circleColor }}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-foreground leading-snug">{meta.nome}</h3>
                          <Badge
                            variant={statusCfg.variant}
                            className={cn('text-xs flex-shrink-0', statusCfg.className)}
                          >
                            {statusCfg.label}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-emerald-400 font-semibold tabular-nums">{formatBRL(meta.valor_atual)}</span>
                          <span className="text-muted-foreground tabular-nums">de {formatBRL(meta.valor_meta)}</span>
                        </div>

                        <Progress
                          value={Math.min(pct, 100)}
                          indicatorClassName={getGoalProgressColor(pct)}
                          className="h-1.5 mb-2"
                        />

                        <div className="flex items-center justify-between flex-wrap gap-1">
                          {dias !== null && (
                            <div className={cn(
                              'flex items-center gap-1 text-xs',
                              dias < 0 ? 'text-red-400' : dias < 90 ? 'text-amber-400' : 'text-muted-foreground'
                            )}>
                              <Timer1 size={11} />
                              {dias > 0 ? `${dias} dias restantes` : dias === 0 ? 'Vence hoje' : `Vencida há ${Math.abs(dias)} dias`}
                            </div>
                          )}
                          {remaining > 0 && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              faltam {formatBRL(remaining)}
                            </span>
                          )}
                        </div>

                        {meta.prazo && (
                          <p className="text-xs text-muted-foreground/50 mt-1.5">
                            Prazo: {format(parseISO(meta.prazo), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Budget Section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <WalletMoney size={16} className="text-emerald-400" variant="Bold" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Orçamento Mensal</h2>
              <p className="text-xs text-muted-foreground">{orcamentos.length} categoria{orcamentos.length !== 1 ? 's' : ''} configurada{orcamentos.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {budgetSummary.overCount > 0 && (
            <Badge variant="danger" className="text-xs flex items-center gap-1">
              <Danger size={11} variant="Bold" />
              {budgetSummary.overCount} acima do limite
            </Badge>
          )}
        </div>

        {/* Budget Summary */}
        {orcamentos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-secondary/50 border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Orçamento Total</p>
              <p className="text-base font-bold text-foreground tabular-nums">{formatBRL(budgetSummary.total)}</p>
            </div>
            <div className="rounded-xl bg-secondary/50 border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Gasto Total</p>
              <p className={cn('text-base font-bold tabular-nums', budgetSummary.gasto > budgetSummary.total ? 'text-red-400' : 'text-foreground')}>
                {formatBRL(budgetSummary.gasto)}
              </p>
            </div>
            <div className="rounded-xl bg-secondary/50 border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Disponível</p>
              <p className={cn('text-base font-bold tabular-nums', budgetSummary.total - budgetSummary.gasto >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatBRL(Math.max(0, budgetSummary.total - budgetSummary.gasto))}
              </p>
            </div>
          </div>
        )}

        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-5">
            {orcamentos.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <TickCircle size={32} className="text-muted-foreground/30" variant="Linear" />
                <p className="text-sm text-muted-foreground">Nenhum orçamento configurado</p>
              </div>
            ) : (
              orcamentos.map((orc, i) => {
                const pct = Number(orc.limite) > 0 ? (Number(orc.gasto_atual) / Number(orc.limite) * 100) : 0
                const remaining = Number(orc.limite) - Number(orc.gasto_atual)
                const colors = getBudgetColor(pct)
                return (
                  <div key={orc.id || i} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{orc.categoria}</span>
                        {pct >= 100 && (
                          <Danger size={13} className="text-red-400" variant="Bold" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatBRL(orc.gasto_atual)}
                          <span className="text-muted-foreground/50"> / </span>
                          {formatBRL(orc.limite)}
                        </span>
                        <span className={cn('text-xs font-bold tabular-nums w-10 text-right', colors.text)}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(pct, 100)}
                      indicatorClassName={colors.bar}
                      className="h-2"
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      {remaining > 0 ? (
                        <p className="text-xs text-muted-foreground/60">
                          Restam <span className="font-medium text-muted-foreground">{formatBRL(remaining)}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-red-400/80">
                          Excedido em {formatBRL(Math.abs(remaining))}
                        </p>
                      )}
                      {/* Mini bar labels */}
                      <div className="flex items-center gap-1">
                        {[25, 50, 75, 90].map(threshold => (
                          <div
                            key={threshold}
                            className={cn(
                              'w-1 h-1 rounded-full',
                              pct >= threshold ? colors.bar : 'bg-secondary'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
