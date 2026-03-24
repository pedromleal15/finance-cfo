import { Warning2 } from 'iconsax-react'

export function ErrorState({ message = 'Erro ao carregar dados', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <Warning2 size={24} className="text-red-400" variant="Bold" />
      </div>
      <p className="text-muted-foreground text-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm bg-accent hover:bg-zinc-700 rounded-md transition-colors text-foreground"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
