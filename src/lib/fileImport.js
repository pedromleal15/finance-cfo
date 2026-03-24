import * as XLSX from 'xlsx'
import { supabase } from './supabase'

// Parse CSV text into array of objects
function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/['"]/g, ''))
    if (values.length < 2) continue
    const row = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
    rows.push(row)
  }
  return rows
}

// Parse XLSX file buffer into array of objects
function parseXLSX(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  // Normalize headers to lowercase
  return data.map(row => {
    const normalized = {}
    Object.keys(row).forEach(key => {
      normalized[key.toLowerCase().trim()] = row[key]
    })
    return normalized
  })
}

// Map column names (flexible matching)
const COLUMN_MAP = {
  descricao: ['descricao', 'descrição', 'description', 'desc', 'nome', 'name'],
  valor: ['valor', 'value', 'amount', 'quantia', 'montante'],
  tipo: ['tipo', 'type', 'natureza'],
  categoria: ['categoria', 'category', 'cat'],
  conta: ['conta', 'account', 'banco', 'bank'],
  data: ['data', 'date', 'dt', 'dia'],
  status: ['status', 'situacao', 'situação', 'state'],
}

function mapColumns(row) {
  const mapped = {}
  for (const [targetCol, aliases] of Object.entries(COLUMN_MAP)) {
    for (const alias of aliases) {
      if (row[alias] !== undefined && row[alias] !== '') {
        mapped[targetCol] = row[alias]
        break
      }
    }
  }
  return mapped
}

// Normalize transaction data
function normalizeTransaction(row) {
  const mapped = mapColumns(row)

  if (!mapped.descricao || !mapped.valor) return null

  let valor = mapped.valor
  if (typeof valor === 'string') {
    valor = valor.replace(/[R$\s.]/g, '').replace(',', '.')
  }
  valor = parseFloat(valor)
  if (isNaN(valor)) return null

  let tipo = (mapped.tipo || '').toLowerCase().trim()
  if (['receita', 'entrada', 'income', 'credit', 'crédito', 'credito'].includes(tipo)) {
    tipo = 'receita'
  } else if (['despesa', 'saída', 'saida', 'expense', 'debit', 'débito', 'debito'].includes(tipo)) {
    tipo = 'despesa'
  } else {
    tipo = valor >= 0 ? 'receita' : 'despesa'
  }

  valor = Math.abs(valor)

  let data = mapped.data || new Date().toISOString().split('T')[0]
  if (typeof data === 'number') {
    // Excel date serial number
    const excelDate = new Date((data - 25569) * 86400 * 1000)
    data = excelDate.toISOString().split('T')[0]
  } else if (typeof data === 'string') {
    // Try DD/MM/YYYY format
    const parts = data.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
    if (parts) {
      const day = parts[1].padStart(2, '0')
      const month = parts[2].padStart(2, '0')
      let year = parts[3]
      if (year.length === 2) year = '20' + year
      data = year + '-' + month + '-' + day
    }
  }

  return {
    descricao: String(mapped.descricao).trim(),
    valor,
    tipo,
    categoria: String(mapped.categoria || 'Outros').trim(),
    conta: String(mapped.conta || 'Importado').trim(),
    data,
    status: String(mapped.status || 'realizado').trim(),
  }
}

export async function importFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        let rows = []
        const fileName = file.name.toLowerCase()

        if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
          const text = e.target.result
          rows = parseCSV(text)
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          const buffer = new Uint8Array(e.target.result)
          rows = parseXLSX(buffer)
        } else {
          reject(new Error('Formato não suportado. Use .csv, .xlsx ou .xls'))
          return
        }

        if (rows.length === 0) {
          reject(new Error('Nenhum dado encontrado no arquivo'))
          return
        }

        // Normalize all rows
        const transactions = rows
          .map(normalizeTransaction)
          .filter(t => t !== null)

        if (transactions.length === 0) {
          reject(new Error('Nenhuma transação válida encontrada. Verifique as colunas: descricao, valor, tipo, categoria, conta, data'))
          return
        }

        // Insert into Supabase in batches of 100
        const batchSize = 100
        let inserted = 0

        for (let i = 0; i < transactions.length; i += batchSize) {
          const batch = transactions.slice(i, i + batchSize)
          const { error } = await supabase.from('transacoes').insert(batch)
          if (error) {
            reject(new Error('Erro ao inserir dados: ' + error.message))
            return
          }
          inserted += batch.length
        }

        resolve({
          total: rows.length,
          imported: inserted,
          skipped: rows.length - inserted,
        })
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))

    if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

// Get preview of file data before importing
export async function previewFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        let rows = []
        const fileName = file.name.toLowerCase()

        if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
          rows = parseCSV(e.target.result)
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          rows = parseXLSX(new Uint8Array(e.target.result))
        }

        const preview = rows.slice(0, 5).map(normalizeTransaction).filter(Boolean)
        const total = rows.filter(r => normalizeTransaction(r) !== null).length

        resolve({ preview, total, columns: rows.length > 0 ? Object.keys(rows[0]) : [] })
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))

    if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}
