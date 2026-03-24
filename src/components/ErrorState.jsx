import { Warning2, Refresh } from 'iconsax-react'
import { cn } from '@/lib/utils'

export function ErrorState({
  title = 'Algo deu errado',
  message = 'Erro ao carregar dados. Verifique sua conexão e tente novamente.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
    >
      {/* Icon with red accent */}
      <div className="relative mb-5">
        {/* Glow behind icon */}
        <div
          className="absolute inset-0 rounded-3xl blur-xl opacity-25"
          style={{
            background: 'radial-gradient(circle, hsl(0 84% 60% / 0.8), transparent 70%)',
            transform: 'scale(1.5)',
          }}
        />

        {/* Icon container */}
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(0 84% 60% / 0.15), hsl(0 84% 60% / 0.06))',
            border: '1px solid hsl(0 84% 60% / 0.25)',
            boxShadow: '0 6px 24px hsl(0 84% 60% / 0.12), inset 0 1px 0 hsl(0 0% 100% / 0.05)',
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.07) 0%, transparent 60%)',
            }}
          />
          <Warning2
            size={28}
            variant="Bold"
            className="relative"
            style={{ color: 'hsl(0 84% 60%)' }}
          />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-foreground mb-1.5 tracking-tight">
        {title}
      </h3>

      {/* Message */}
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
        {message}
      </p>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
            'border border-border hover:border-border/80',
            'bg-card hover:bg-accent/60',
            'text-foreground',
            'transition-all duration-200 active:scale-95',
          )}
        >
          <Refresh
            size={15}
            variant="Linear"
            className="text-muted-foreground transition-transform duration-300 group-hover:rotate-180"
          />
          Tentar novamente
        </button>
      )}

      {/* Error accent line at bottom */}
      <div
        className="mt-8 h-px w-16 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(0 84% 60% / 0.4), transparent)',
        }}
      />
    </div>
  )
}
