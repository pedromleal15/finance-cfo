import { DocumentUpload } from 'iconsax-react'

export function EmptyState({ title = 'Sem dados', description = 'Importe um arquivo para começar.', onImport }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
        <DocumentUpload size={28} className="text-muted-foreground" variant="Linear" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {onImport && (
        <button
          onClick={onImport}
          className="px-5 py-2.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          Importar Arquivo
        </button>
      )}
    </div>
  )
}
