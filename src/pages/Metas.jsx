import { useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatBRL } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SkeletonCard } from '@/components/Skeleton'
import { Flag, Timer1, TickCircle, Danger } from 'iconsax-react'
import { format, parseISO, differenceInDays } from 'date-fns'

export default function Metas() {
  const { metas, orcamentos, loading } = useData()
  if (loading) return <div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div></div>

  const getProgressColor = (pct) => pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-indigo-500' : pct >= 25 ? 'bg-yellow-500' : 'bg-red-500'
  const getBudgetColor = (pct) => pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Metas e Orçamentos</h1>
      <div>
        <div className="flex items-center gap-2 mb-4"><Flag size={20} className="text-indigo-400" variant="Bold" /><h2 className="text-lg font-semibold text-foreground">Metas Financeiras</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metas.map((meta, i) => {
            const pct = Number(meta.valor_meta) > 0 ? (Number(meta.valor_atual) / Number(meta.valor_meta) * 100) : 0
            const dias = meta.prazo ? differenceInDays(parseISO(meta.prazo), new Date()) : null
            return (
              <Card key={meta.id || i} className="bg-card border-border hover:border-border transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{meta.nome}</h3>
                      {dias !== null && <div className="flex items-center gap-1 mt-1"><Timer1 size={12} className="text-foreground0" /><span className={`text-xs ${dias < 90 ? 'text-yellow-400' : 'text-foreground0'}`}>{dias > 0 ? `${dias} dias restantes` : 'Prazo vencido'}</span></div>}
                    </div>
                    <Badge variant={pct >= 100 ? 'success' : pct >= 50 ? 'default' : 'warning'} className="text-xs">{pct >= 100 ? 'Concluída' : `${pct.toFixed(0)}%`}</Badge>
                  </div>
                  <Progress value={Math.min(pct, 100)} indicatorClassName={getProgressColor(pct)} className="h-2 mb-3" />
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{formatBRL(meta.valor_atual)}</span><span className="text-foreground0">{formatBRL(meta.valor_meta)}</span></div>
                  {meta.prazo && <p className="text-xs text-muted-foreground/60 mt-2">Prazo: {format(parseISO(meta.prazo), 'dd/MM/yyyy')}</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-4"><TickCircle size={20} className="text-green-400" variant="Bold" /><h2 className="text-lg font-semibold text-foreground">Orçamento Mensal</h2></div>
        <Card className="bg-card border-border"><CardContent className="p-5 space-y-4">
          {orcamentos.map((orc, i) => {
            const pct = Number(orc.limite) > 0 ? (Number(orc.gasto_atual) / Number(orc.limite) * 100) : 0
            const remaining = Number(orc.limite) - Number(orc.gasto_atual)
            return (
              <div key={orc.id || i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2"><span className="text-sm text-foreground">{orc.categoria}</span>{pct >= 100 && <Danger size={14} className="text-red-400" variant="Bold" />}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-foreground0">{formatBRL(orc.gasto_atual)} / {formatBRL(orc.limite)}</span>
                    <span className={`text-xs font-medium ${pct >= 100 ? 'text-red-400' : pct >= 80 ? 'text-yellow-400' : 'text-green-400'}`}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <Progress value={Math.min(pct, 100)} indicatorClassName={getBudgetColor(pct)} className="h-1.5" />
                {remaining > 0 && <p className="text-xs text-muted-foreground/60 mt-1">Restam {formatBRL(remaining)}</p>}
              </div>
            )
          })}
        </CardContent></Card>
      </div>
    </div>
  )
}
