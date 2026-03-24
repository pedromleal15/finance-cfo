import { useState } from 'react'
import { Sun1, Moon, Notification, DocumentUpload } from 'iconsax-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ImportDialog } from './ImportDialog'

export function Header({ darkMode, onToggleDarkMode }) {
  const [importOpen, setImportOpen] = useState(false)

  return (
    <>
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground hidden sm:block">Painel Financeiro</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
          >
            <DocumentUpload size={18} variant="Linear" />
            <span className="hidden sm:inline">Importar</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {darkMode ? <Sun1 size={20} variant="Bold" /> : <Moon size={20} variant="Bold" />}
          </button>

          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative">
            <Notification size={20} variant="Linear" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <Avatar className="w-9 h-9 cursor-pointer">
            <AvatarImage src="/avatar.jpg" alt="Pedro" />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">PL</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  )
}
