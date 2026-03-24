import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const DataContext = createContext(null)

// ===== FILE IMPORT HELPERS =====
function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/['"]/g, ''))
    if (values.length < 2) continue
    const row = {}
    headers.forEach((h, idx) => { row[h] = values[idx] || '' })
    rows.push(row)
  }
  return rows
}

function parseXLSX(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { defval: '' }).map(row => {
    const n = {}
    Object.keys(row).forEach(k => { n[k.toLowerCase().trim()] = row[k] })
    return n
  })
}

const COL_MAP = {
  descricao: ['descricao', 'descrição', 'description', 'desc', 'nome', 'name'],
  valor: ['valor', 'value', 'amount', 'quantia', 'montante'],
  tipo: ['tipo', 'type', 'natureza'],
  categoria: ['categoria', 'category', 'cat'],
  conta: ['conta', 'account', 'banco', 'bank'],
  data: ['data', 'date', 'dt', 'dia'],
  status: ['status', 'situacao', 'situação'],
}

function mapCols(row) {
  const m = {}
  for (const [target, aliases] of Object.entries(COL_MAP)) {
    for (const a of aliases) {
      if (row[a] !== undefined && row[a] !== '') { m[target] = row[a]; break }
    }
  }
  return m
}

function normalizeTransaction(row) {
  // If row already has descricao/valor directly (from PDF parser), use them
  if (row.descricao && row.valor && row.data && row.data.match(/^\d{4}-\d{2}-\d{2}$/)) {
    let valor = row.valor
    if (typeof valor === 'string') valor = parseFloat(valor)
    if (typeof valor !== 'number' || isNaN(valor) || valor <= 0) return null
    return {
      id: crypto.randomUUID(),
      descricao: String(row.descricao).trim(),
      valor,
      tipo: row.tipo || 'despesa',
      categoria: String(row.categoria || 'Outros').trim(),
      conta: String(row.conta || 'Importado').trim(),
      data: row.data,
      status: 'realizado',
    }
  }

  // CSV/XLSX column mapping
  const m = mapCols(row)
  if (!m.descricao || !m.valor) return null
  let valor = m.valor
  if (typeof valor === 'string') valor = valor.replace(/[R$\s.]/g, '').replace(',', '.')
  valor = parseFloat(valor)
  if (isNaN(valor)) return null

  let tipo = (m.tipo || '').toLowerCase().trim()
  if (['receita', 'entrada', 'income', 'credit', 'crédito', 'credito'].includes(tipo)) tipo = 'receita'
  else if (['despesa', 'saída', 'saida', 'expense', 'debit', 'débito', 'debito'].includes(tipo)) tipo = 'despesa'
  else tipo = valor >= 0 ? 'receita' : 'despesa'
  valor = Math.abs(valor)

  let data = m.data || new Date().toISOString().split('T')[0]
  if (typeof data === 'number') {
    data = new Date((data - 25569) * 86400 * 1000).toISOString().split('T')[0]
  } else if (typeof data === 'string') {
    const parts = data.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
    if (parts) {
      let year = parts[3]; if (year.length === 2) year = '20' + year
      data = `${year}-${parts[2].padStart(2,'0')}-${parts[1].padStart(2,'0')}`
    }
  }

  return {
    id: crypto.randomUUID(),
    descricao: String(m.descricao).trim(),
    valor, tipo,
    categoria: String(m.categoria || 'Outros').trim(),
    conta: String(m.conta || 'Importado').trim(),
    data, status: 'realizado',
  }
}

// ===== PDF PARSER =====
const MONTH_MAP = {
  'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04', 'MAI': '05', 'JUN': '06',
  'JUL': '07', 'AGO': '08', 'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12',
}

function guessCategory(desc) {
  const d = desc.toLowerCase()
  if (/supermercado|mercado|pao de acucar|extra|carrefour|swift|hirota|mini extra/i.test(d)) return 'Alimentação'
  if (/restaurante|guaco|ifood|rappi|burger|pizza|sushi|padaria|lanche|cafe/i.test(d)) return 'Alimentação'
  if (/uber|99|taxi|cabify|estacion|parking|combustivel|shell|ipiranga/i.test(d)) return 'Transporte'
  if (/netflix|spotify|disney|hbo|amazon prime|youtube|apple|claude|chatgpt|tiktok/i.test(d)) return 'Assinaturas'
  if (/drogasil|droga|farmacia|farma|saude|plano|hospital|medic|drogaria/i.test(d)) return 'Saúde'
  if (/academia|sport|gym|fitness|trevo sport/i.test(d)) return 'Saúde'
  if (/aluguel|condominio|energia|agua|luz|internet|gas|iptu/i.test(d)) return 'Moradia'
  if (/amazon|mercadolivre|shopee|magazine|americanas|tiktok shop|petz|petlove|nike/i.test(d)) return 'Compras'
  if (/curso|escola|faculdade|udemy|alura|livro/i.test(d)) return 'Educação'
  if (/pagamento|pix/i.test(d)) return 'Transferência'
  return 'Outros'
}

async function parsePDF(buffer) {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join('|')
    fullText += pageText + '\n'
  }

  const rows = []

  // Detect year from header (e.g., "FATURA 19 MAR 2026")
  const yearMatch = fullText.match(/FATURA\s+\d+\s+\w+\s+(\d{4})/)
  const defaultYear = yearMatch ? yearMatch[1] : new Date().getFullYear().toString()

  // Nubank format: DD MMM | •••• XXXX | Description | R$ XX,XX
  // Also handles: DD MMM | •••• XXXX | Description | -R$ XX,XX or −R$ XX,XX
  const segments = fullText.split('|').map(s => s.trim()).filter(Boolean)

  let i = 0
  while (i < segments.length) {
    const seg = segments[i]

    // Match date pattern: "DD MMM" (e.g., "12 FEV", "02 MAR")
    const dateMatch = seg.match(/^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)$/i)
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0')
      const month = MONTH_MAP[dateMatch[2].toUpperCase()]
      const dateStr = `${defaultYear}-${month}-${day}`

      // Look ahead for card number, description, and value
      let desc = ''
      let valor = ''
      let j = i + 1

      // Skip card number (•••• XXXX)
      if (j < segments.length && /^[•\*]+\s*\d{4}$/.test(segments[j])) j++

      // Grab description (next segment that's not a value)
      if (j < segments.length && !/^-?R?\$/.test(segments[j]) && !/^\d{1,2}\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)$/i.test(segments[j])) {
        desc = segments[j]
        j++
      }

      // Skip conversion info lines (e.g., "BRL 503.52 = USD 96.22")
      while (j < segments.length && /^(BRL|Conversão|USD|EUR)/i.test(segments[j])) j++

      // Grab value (R$ XX,XX or −R$ XX,XX)
      if (j < segments.length && /^[−\-]?R?\$?\s*[\d.,]+$/.test(segments[j])) {
        valor = segments[j]
        j++
      }

      if (desc && valor) {
        // Check if it's a negative/credit value (payment received)
        const isNegative = /^[−\-]/.test(valor)
        const cleanVal = valor.replace(/[−\-R$\s]/g, '').replace(/\./g, '').replace(',', '.')
        const numVal = parseFloat(cleanVal)

        if (!isNaN(numVal) && numVal > 0) {
          rows.push({
            data: dateStr,
            descricao: desc.replace(/\s+/g, ' ').trim(),
            valor: cleanVal,
            tipo: isNegative ? 'receita' : 'despesa',
            categoria: isNegative ? 'Transferência' : guessCategory(desc),
            conta: 'Nubank',
          })
        }
      }

      i = j
      continue
    }

    // Also match "Pagamento em DD MMM" pattern
    const pagMatch = seg.match(/^Pagamento em\s+(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)/i)
    if (pagMatch) {
      const day = pagMatch[1].padStart(2, '0')
      const month = MONTH_MAP[pagMatch[2].toUpperCase()]
      const dateStr = `${defaultYear}-${month}-${day}`
      // Next segment should be the value
      if (i + 1 < segments.length && /^[−\-]?R?\$?\s*[\d.,]+$/.test(segments[i + 1])) {
        const valor = segments[i + 1]
        const cleanVal = valor.replace(/[−\-R$\s]/g, '').replace(/\./g, '').replace(',', '.')
        const numVal = parseFloat(cleanVal)
        if (!isNaN(numVal) && numVal > 0) {
          rows.push({
            data: dateStr,
            descricao: 'Pagamento de Fatura',
            valor: cleanVal,
            tipo: 'receita',
            categoria: 'Transferência',
            conta: 'Nubank',
          })
        }
        i += 2
        continue
      }
    }

    i++
  }

  // Fallback for other PDF formats: regex-based extraction
  if (rows.length === 0) {
    const moneyPattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})?\s*(.+?)\s+(R?\$?\s*-?[\d.]+,\d{2})/g
    let match
    while ((match = moneyPattern.exec(fullText)) !== null) {
      const dateStr = match[1] || ''
      const desc = match[2].trim()
      const valStr = match[3].trim()
      if (desc.length > 2 && desc.length < 100) {
        rows.push({ data: dateStr, descricao: desc, valor: valStr, tipo: 'despesa' })
      }
    }
  }

  return rows
}

// ===== STORAGE HELPERS =====
const STORAGE_KEY = 'finance-cfo-data'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

// ===== PROVIDER =====
export function DataProvider({ children }) {
  const [transacoes, setTransacoes] = useState([])
  const [metas, setMetas] = useState([])
  const [ativos, setAtivos] = useState([])
  const [orcamentos, setOrcamentos] = useState([])
  const [loading, setLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    const CLEAN_KEY = 'finance-cfo-v2-clean'
    // One-time wipe of old corrupted data
    if (!localStorage.getItem(CLEAN_KEY)) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(CLEAN_KEY, '1')
    }
    const stored = loadFromStorage()
    if (stored) {
      setTransacoes(stored.transacoes || [])
      setMetas(stored.metas || [])
      setAtivos(stored.ativos || [])
      setOrcamentos(stored.orcamentos || [])
    }
    setLoading(false)
  }, [])

  // Persist on change
  useEffect(() => {
    if (!loading) {
      saveToStorage({ transacoes, metas, ativos, orcamentos })
    }
  }, [transacoes, metas, ativos, orcamentos, loading])

  const addTransaction = useCallback((t) => {
    const newT = { ...t, id: crypto.randomUUID() }
    setTransacoes(prev => [newT, ...prev])
    return newT
  }, [])

  const importFile = useCallback(async (file) => {
    const name = file.name.toLowerCase()
    let rows = []

    if (name.endsWith('.pdf')) {
      const buffer = await file.arrayBuffer()
      rows = await parsePDF(new Uint8Array(buffer))
    } else {
      rows = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            if (name.endsWith('.csv') || name.endsWith('.txt')) {
              resolve(parseCSV(e.target.result))
            } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
              resolve(parseXLSX(new Uint8Array(e.target.result)))
            } else {
              reject(new Error('Formato não suportado. Use .csv, .xlsx, .xls ou .pdf'))
            }
          } catch (err) { reject(err) }
        }
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
        if (name.endsWith('.csv') || name.endsWith('.txt')) reader.readAsText(file)
        else reader.readAsArrayBuffer(file)
      })
    }

    const transactions = rows.map(normalizeTransaction).filter(Boolean)
    if (transactions.length === 0) {
      throw new Error('Nenhuma transação válida encontrada. Colunas esperadas: descricao, valor, tipo, categoria, conta, data')
    }
    setTransacoes(prev => [...transactions, ...prev])
    return { total: rows.length, imported: transactions.length, skipped: rows.length - transactions.length }
  }, [])

  const previewFile = useCallback(async (file) => {
    const name = file.name.toLowerCase()
    let rows = []

    if (name.endsWith('.pdf')) {
      const buffer = await file.arrayBuffer()
      rows = await parsePDF(new Uint8Array(buffer))
    } else {
      rows = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            if (name.endsWith('.csv') || name.endsWith('.txt')) resolve(parseCSV(e.target.result))
            else if (name.endsWith('.xlsx') || name.endsWith('.xls')) resolve(parseXLSX(new Uint8Array(e.target.result)))
            else resolve([])
          } catch (err) { reject(err) }
        }
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
        if (name.endsWith('.csv') || name.endsWith('.txt')) reader.readAsText(file)
        else reader.readAsArrayBuffer(file)
      })
    }

    const allValid = rows.map(normalizeTransaction).filter(Boolean)
    return { preview: allValid.slice(0, 5), total: allValid.length, columns: rows.length > 0 ? Object.keys(rows[0]) : [] }
  }, [])

  const resetData = useCallback(() => {
    setTransacoes([])
    setMetas([])
    setAtivos([])
    setOrcamentos([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <DataContext.Provider value={{
      transacoes, metas, ativos, orcamentos, loading,
      addTransaction, importFile, previewFile, resetData,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
