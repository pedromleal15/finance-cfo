import { NavLink } from 'react-router-dom'
import { Category2, MoneyRecive, Receipt21, Flag, Lamp } from 'iconsax-react'

const navItems = [
  { to: '/', label: 'Home', icon: Category2 },
  { to: '/cashflow', label: 'Caixa', icon: MoneyRecive },
  { to: '/transacoes', label: 'Transações', icon: Receipt21 },
  { to: '/metas', label: 'Metas', icon: Flag },
  { to: '/insights', label: 'Insights', icon: Lamp },
]

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-40 px-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon size={20} variant={isActive ? 'Bold' : 'Linear'} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
