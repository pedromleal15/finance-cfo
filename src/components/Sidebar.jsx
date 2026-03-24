import { NavLink } from 'react-router-dom'
import {
  Category2,
  MoneyRecive,
  Chart21,
  Building,
  Receipt21,
  Flag,
  Lamp,
  ArrowLeft2,
  ArrowRight2,
} from 'iconsax-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Category2 },
  { to: '/cashflow', label: 'Fluxo de Caixa', icon: MoneyRecive },
  { to: '/analytics', label: 'Análise', icon: Chart21 },
  { to: '/patrimonio', label: 'Patrimônio', icon: Building },
  { to: '/transacoes', label: 'Transações', icon: Receipt21 },
  { to: '/metas', label: 'Metas', icon: Flag },
  { to: '/insights', label: 'Insights', icon: Lamp },
]

export function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40',
        'bg-[hsl(var(--sidebar))] border-r border-border',
        'transition-[width] duration-300 ease-in-out will-change-[width]',
        collapsed ? 'w-[72px]' : 'w-[240px]',
      )}
    >
      {/* Logo section */}
      <div
        className={cn(
          'h-16 flex items-center border-b border-border flex-shrink-0',
          collapsed ? 'px-0 justify-center' : 'px-4',
        )}
      >
        {/* Icon with subtle indigo glow */}
        <div
          className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(239 84% 72%), hsl(239 84% 55%))',
            boxShadow: '0 0 0 1px hsl(239 84% 67% / 0.3), 0 4px 12px hsl(239 84% 67% / 0.35)',
          }}
        >
          {/* Inner shine */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)',
            }}
          />
          <span className="relative text-white font-bold text-base tracking-tight select-none">F</span>
        </div>

        {/* Brand name — fades and slides out when collapsed */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            collapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3',
          )}
        >
          <span className="whitespace-nowrap text-base font-semibold text-foreground tracking-tight">
            Finance CFO
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {/* Main section label */}
        {!collapsed && (
          <p className="px-3 pt-1 pb-2 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50 select-none">
            Principal
          </p>
        )}

        {navItems.slice(0, 5).map((item) => (
          <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
        ))}

        {/* Separator */}
        <div className="my-3 mx-2 border-t border-border/60" />

        {/* Tools section label */}
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50 select-none">
            Ferramentas
          </p>
        )}

        {navItems.slice(5).map((item) => (
          <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Pro badge + collapse toggle */}
      <div className="flex-shrink-0 border-t border-border">
        {/* Pro badge */}
        {!collapsed && (
          <div className="px-4 py-3">
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.12), hsl(239 84% 67% / 0.04))',
                border: '1px solid hsl(239 84% 67% / 0.2)',
              }}
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, hsl(239 84% 72%), hsl(239 84% 55%))',
                }}
              >
                <span className="text-white text-[9px] font-bold leading-none">PRO</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground leading-tight">Finance CFO Pro</p>
                <p className="text-[10px] text-muted-foreground leading-tight">v2.0.1</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse toggle button */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          className={cn(
            'w-full flex items-center justify-center h-11 text-muted-foreground',
            'hover:text-foreground hover:bg-accent/60',
            'transition-colors duration-150',
            collapsed ? '' : 'border-t border-border/40',
          )}
        >
          <span
            className="flex items-center justify-center transition-transform duration-300"
            style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(0deg)' }}
          >
            {collapsed ? <ArrowRight2 size={16} /> : <ArrowLeft2 size={16} />}
          </span>
          {!collapsed && (
            <span className="ml-2 text-xs text-muted-foreground/70">Recolher</span>
          )}
        </button>
      </div>
    </aside>
  )
}

function SidebarNavItem({ item, collapsed }) {
  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
          'transition-all duration-200 group select-none overflow-hidden',
          collapsed ? 'justify-center' : '',
          isActive
            ? [
                'text-primary',
                'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
                'before:w-[3px] before:h-5 before:rounded-r-full before:bg-primary',
              ].join(' ')
            : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active background gradient */}
          {isActive && (
            <span
              className="absolute inset-0 rounded-lg"
              style={{
                background:
                  'linear-gradient(135deg, hsl(239 84% 67% / 0.14) 0%, hsl(239 84% 67% / 0.06) 100%)',
              }}
            />
          )}

          {/* Hover background */}
          {!isActive && (
            <span className="absolute inset-0 rounded-lg bg-accent/0 group-hover:bg-accent/70 transition-colors duration-150" />
          )}

          <span className="relative flex-shrink-0">
            <item.icon
              size={20}
              variant={isActive ? 'Bold' : 'Linear'}
              className={cn(
                'transition-transform duration-200',
                !isActive && 'group-hover:scale-110',
              )}
            />
          </span>

          {/* Label — slides and fades when collapsing */}
          <span
            className={cn(
              'relative whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out',
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
            )}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  )
}
