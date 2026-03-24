import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DataProvider } from './contexts/DataContext'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Cashflow from './pages/Cashflow'
import Analytics from './pages/Analytics'
import Patrimonio from './pages/Patrimonio'
import Transacoes from './pages/Transacoes'
import Metas from './pages/Metas'
import Insights from './pages/Insights'

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cashflow" element={<Cashflow />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/patrimonio" element={<Patrimonio />} />
            <Route path="/transacoes" element={<Transacoes />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/insights" element={<Insights />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}

export default App
