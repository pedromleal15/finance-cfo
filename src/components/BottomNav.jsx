import { NavLink } from 'react-router-dom'
import { Category2, MoneyRecive, Receipt21, Flag, Lamp } from 'iconsax-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Home', icon: Category2 },
  { to: '/cashflow', label: 'Caixa', icon: MoneyRecive },
  { to: '/transacoes', label: 'Transações', icon: Receipt21 },
  { to: '/metas', label: 'Metas', icon: Flag },
  { to: '/insights', label: 'Insights', icon: Lamp },
]

export function BottomNav() {
  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-40',
        'h-[64px] flex items-center justify-around',
        'px-2 safe-area-inset-bottom',
        // Glass effect
        'bg-[hsl(var(--card)/0.85)] backdrop-blur-2xl backdrop-saturate-150',
        'border-t border-border/50',
        'shadow-[0_-1px_0_0_hsl(var(--border)/0.4),0_-4px_20px_-4px_hsl(240_10%_3.9%/0.15)]',
      )}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className="flex-1 max-w-[80px]"
        >
          {({ isActive }) => (
            <span
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-1 rounded-xl mx-0.5',
                'transition-all duration-200 active:scale-90 select-none',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
              style={{
                transform: isActive ? 'scale(1)' : undefined,
              }}
            >
              {/* Active pill indicator */}
              <span className="relative">
                {isActive && (
                  <span
                    className="absolute -top-1 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-primary pill-indicator"
                    style={{
                      boxShadow: '0 0 6px 0 hsl(var(--primary) / 0.6)',
                    }}
                  />
                )}

                {/* Icon wrapper with active background */}
                <span
                  className={cn(
                    'flex items-center justify-center w-10 h-8 rounded-xl',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-primary/12'
                      : 'bg-transparent',
                  )}
                >
                  <item.icon
                    size={20}
                    variant={isActive ? 'Bold' : 'Linear'}
                    className={cn(
                      'transition-transform duration-200',
                      isActive ? 'scale-110' : 'scale-100',
                    )}
                  />
                </span>
              </span>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-medium leading-none transition-all duration-200',
                  isActive ? 'text-primary font-semibold' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
