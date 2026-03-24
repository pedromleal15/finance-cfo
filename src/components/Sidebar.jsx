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
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border shadow-sm transition-all duration-300 z-40 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        {!collapsed && (
          <span className="ml-3 text-lg font-semibold text-foreground whitespace-nowrap">Finance CFO</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  variant={isActive ? 'Bold' : 'Linear'}
                  className="flex-shrink-0"
                />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="h-12 flex items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ArrowRight2 size={18} /> : <ArrowLeft2 size={18} />}
      </button>
    </aside>
  )
}
