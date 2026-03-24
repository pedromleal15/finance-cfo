import { DocumentUpload } from 'iconsax-react'
import { cn } from '@/lib/utils'

export function EmptyState({
  title = 'Sem dados',
  description = 'Importe um arquivo para começar a visualizar suas finanças.',
  onImport,
  icon: IconComponent = DocumentUpload,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 px-6 text-center',
        className,
      )}
    >
      {/* Animated icon container */}
      <div className="relative mb-6 animate-float">
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-3xl blur-xl opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)',
            transform: 'scale(1.4)',
          }}
        />

        {/* Icon background with gradient */}
        <div
          className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.06))',
            border: '1px solid hsl(var(--primary) / 0.2)',
            boxShadow: '0 8px 32px hsl(var(--primary) / 0.12), inset 0 1px 0 hsl(0 0% 100% / 0.06)',
          }}
        >
          {/* Inner shine */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.08) 0%, transparent 60%)',
            }}
          />
          <IconComponent
            size={32}
            variant="Linear"
            className="relative text-primary"
          />
        </div>
      </div>

      {/* Typography */}
      <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-8">
        {description}
      </p>

      {/* CTA button */}
      {onImport && (
        <button
          onClick={onImport}
          className={cn(
            'group relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white',
            'transition-all duration-200',
            'hover:scale-[1.03] active:scale-[0.98]',
          )}
          style={{
            background: 'linear-gradient(135deg, hsl(239 84% 72%), hsl(239 84% 55%))',
            boxShadow: '0 4px 16px hsl(239 84% 67% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.15)',
          }}
        >
          {/* Inner shine on hover */}
          <span
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.12) 0%, transparent 60%)',
            }}
          />
          <DocumentUpload
            size={16}
            variant="Linear"
            className="relative flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5"
          />
          <span className="relative">Importar Arquivo</span>
        </button>
      )}

      {/* Subtle decorative dots */}
      <div className="flex gap-1.5 mt-10 opacity-30">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
            style={{ opacity: 1 - i * 0.25 }}
          />
        ))}
      </div>
    </div>
  )
}
