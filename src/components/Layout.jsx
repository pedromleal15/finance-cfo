import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('finance-cfo-theme')
    if (saved !== null) return saved === 'dark'
    return true // default dark
  })

  // Apply the saved theme class on first mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('finance-cfo-theme', next ? 'dark' : 'light')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content — shifts right to accommodate the fixed sidebar */}
      <div
        className={[
          'flex-1 flex flex-col min-w-0',
          'transition-[margin] duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]',
        ].join(' ')}
      >
        <Header darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  )
}
