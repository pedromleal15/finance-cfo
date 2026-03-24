import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sun1, Moon, Notification, DocumentUpload, ArrowRight2 } from 'iconsax-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ImportDialog } from './ImportDialog'
import { cn } from '@/lib/utils'

// Map route paths to readable page titles and breadcrumb chains
const ROUTE_META = {
  '/': { title: 'Dashboard', crumbs: ['Início', 'Dashboard'] },
  '/cashflow': { title: 'Fluxo de Caixa', crumbs: ['Início', 'Fluxo de Caixa'] },
  '/analytics': { title: 'Análise', crumbs: ['Início', 'Análise'] },
  '/patrimonio': { title: 'Patrimônio', crumbs: ['Início', 'Patrimônio'] },
  '/transacoes': { title: 'Transações', crumbs: ['Início', 'Transações'] },
  '/metas': { title: 'Metas', crumbs: ['Início', 'Metas'] },
  '/insights': { title: 'Insights', crumbs: ['Início', 'Insights'] },
}

export function Header({ darkMode, onToggleDarkMode }) {
  const [importOpen, setImportOpen] = useState(false)
  const location = useLocation()

  const meta = ROUTE_META[location.pathname] ?? { title: 'Finance CFO', crumbs: ['Início'] }

  return (
    <>
      <header
        className={cn(
          'h-16 sticky top-0 z-30 flex-shrink-0',
          'flex items-center justify-between px-4 lg:px-6',
          // Glass effect
          'border-b border-border/60',
          'bg-[hsl(var(--card)/0.75)] backdrop-blur-xl backdrop-saturate-150',
          // Subtle bottom shadow
          'shadow-[0_1px_0_0_hsl(var(--border)/0.5),0_2px_8px_-2px_hsl(240_10%_3.9%/0.08)]',
        )}
      >
        {/* Left — breadcrumb / page title */}
        <div className="flex flex-col justify-center min-w-0">
          {/* Breadcrumb — only on larger screens */}
          <nav className="hidden sm:flex items-center gap-1.5 mb-0.5" aria-label="Breadcrumb">
            {meta.crumbs.map((crumb, idx) => {
              const isLast = idx === meta.crumbs.length - 1
              return (
                <span key={crumb} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-[11px] font-medium leading-none tracking-wide',
                      isLast
                        ? 'text-primary'
                        : 'text-muted-foreground/60',
                    )}
                  >
                    {crumb}
                  </span>
                  {!isLast && (
                    <ArrowRight2 size={10} className="text-muted-foreground/40 flex-shrink-0" />
                  )}
                </span>
              )
            })}
          </nav>

          {/* Page title */}
          <h1 className="text-base font-semibold text-foreground leading-tight tracking-tight truncate">
            {meta.title}
          </h1>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Import button */}
          <button
            onClick={() => setImportOpen(true)}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
              'bg-primary/10 text-primary',
              'hover:bg-primary/18 active:bg-primary/24',
              'border border-primary/15 hover:border-primary/25',
              'transition-all duration-150',
            )}
          >
            <DocumentUpload
              size={16}
              variant="Linear"
              className="flex-shrink-0 icon-upload-bounce transition-transform duration-200 group-hover:-translate-y-0.5"
            />
            <span className="hidden sm:inline whitespace-nowrap">Importar</span>
          </button>

          {/* Dark/light mode toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
            className={cn(
              'w-9 h-9 flex items-center justify-center rounded-lg',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-accent/70 active:bg-accent',
              'transition-all duration-150',
            )}
          >
            <span
              className="flex items-center justify-center transition-transform duration-300"
              style={{
                transform: darkMode ? 'rotate(0deg)' : 'rotate(180deg)',
              }}
            >
              {darkMode ? (
                <Sun1 size={18} variant="Bold" />
              ) : (
                <Moon size={18} variant="Bold" />
              )}
            </span>
          </button>

          {/* Notification bell with animated pulse dot */}
          <button
            title="Notificações"
            className={cn(
              'relative w-9 h-9 flex items-center justify-center rounded-lg',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-accent/70 active:bg-accent',
              'transition-all duration-150',
            )}
          >
            <Notification size={18} variant="Linear" />
            {/* Outer pulse ring */}
            <span className="absolute top-2 right-2 w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-red-500 opacity-60 animate-ping" />
              <span className="relative block w-2 h-2 rounded-full bg-red-500 border border-[hsl(var(--card))]" />
            </span>
          </button>

          {/* Avatar with online indicator */}
          <div className="relative ml-1">
            <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-border hover:ring-primary/40 transition-all duration-150">
              <AvatarImage src="/avatar.jpg" alt="Pedro" />
              <AvatarFallback
                className="text-xs font-semibold"
                style={{
                  background: 'linear-gradient(135deg, hsl(239 84% 72%), hsl(239 84% 55%))',
                  color: '#fff',
                }}
              >
                PL
              </AvatarFallback>
            </Avatar>
            {/* Online green dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[hsl(var(--card))]"
              title="Online"
            />
          </div>
        </div>
      </header>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  )
}
