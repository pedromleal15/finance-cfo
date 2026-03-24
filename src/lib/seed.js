import { supabase } from './supabase'

const transacoesSeed = [
  { descricao: 'Salário', valor: 15000, tipo: 'receita', categoria: 'Salário', conta: 'Nubank', data: '2026-03-01', status: 'realizado' },
  { descricao: 'Freelance Design', valor: 3500, tipo: 'receita', categoria: 'Freelance', conta: 'Nubank', data: '2026-03-05', status: 'realizado' },
  { descricao: 'Dividendos ITUB4', valor: 850, tipo: 'receita', categoria: 'Investimentos', conta: 'XP', data: '2026-03-10', status: 'realizado' },
  { descricao: 'Rendimento CDB', valor: 420, tipo: 'receita', categoria: 'Investimentos', conta: 'XP', data: '2026-03-12', status: 'realizado' },
  { descricao: 'Consultoria', valor: 2000, tipo: 'receita', categoria: 'Freelance', conta: 'Inter', data: '2026-03-15', status: 'realizado' },
  { descricao: 'Aluguel', valor: 3200, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2026-03-01', status: 'realizado' },
  { descricao: 'Condomínio', valor: 850, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2026-03-05', status: 'realizado' },
  { descricao: 'Supermercado', valor: 1200, tipo: 'despesa', categoria: 'Alimentação', conta: 'Nubank', data: '2026-03-03', status: 'realizado' },
  { descricao: 'iFood', valor: 380, tipo: 'despesa', categoria: 'Alimentação', conta: 'Nubank', data: '2026-03-08', status: 'realizado' },
  { descricao: 'Restaurante', valor: 450, tipo: 'despesa', categoria: 'Alimentação', conta: 'Inter', data: '2026-03-12', status: 'realizado' },
  { descricao: 'Uber', valor: 320, tipo: 'despesa', categoria: 'Transporte', conta: 'Nubank', data: '2026-03-04', status: 'realizado' },
  { descricao: 'Combustível', valor: 280, tipo: 'despesa', categoria: 'Transporte', conta: 'Inter', data: '2026-03-09', status: 'realizado' },
  { descricao: 'Netflix', valor: 55, tipo: 'despesa', categoria: 'Assinaturas', conta: 'Nubank', data: '2026-03-01', status: 'realizado' },
  { descricao: 'Spotify', valor: 34, tipo: 'despesa', categoria: 'Assinaturas', conta: 'Nubank', data: '2026-03-01', status: 'realizado' },
  { descricao: 'ChatGPT Plus', valor: 100, tipo: 'despesa', categoria: 'Assinaturas', conta: 'Nubank', data: '2026-03-01', status: 'realizado' },
  { descricao: 'Academia', valor: 150, tipo: 'despesa', categoria: 'Saúde', conta: 'Nubank', data: '2026-03-01', status: 'realizado' },
  { descricao: 'Plano de Saúde', valor: 890, tipo: 'despesa', categoria: 'Saúde', conta: 'Nubank', data: '2026-03-05', status: 'realizado' },
  { descricao: 'Energia', valor: 220, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2026-03-10', status: 'realizado' },
  { descricao: 'Internet', valor: 120, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2026-03-10', status: 'realizado' },
  { descricao: 'Curso Udemy', valor: 47, tipo: 'despesa', categoria: 'Educação', conta: 'Nubank', data: '2026-03-14', status: 'realizado' },
  // Previous months data
  { descricao: 'Salário', valor: 15000, tipo: 'receita', categoria: 'Salário', conta: 'Nubank', data: '2026-02-01', status: 'realizado' },
  { descricao: 'Freelance', valor: 2800, tipo: 'receita', categoria: 'Freelance', conta: 'Nubank', data: '2026-02-10', status: 'realizado' },
  { descricao: 'Dividendos', valor: 720, tipo: 'receita', categoria: 'Investimentos', conta: 'XP', data: '2026-02-15', status: 'realizado' },
  { descricao: 'Aluguel', valor: 3200, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2026-02-01', status: 'realizado' },
  { descricao: 'Supermercado', valor: 1350, tipo: 'despesa', categoria: 'Alimentação', conta: 'Nubank', data: '2026-02-05', status: 'realizado' },
  { descricao: 'Uber', valor: 290, tipo: 'despesa', categoria: 'Transporte', conta: 'Nubank', data: '2026-02-08', status: 'realizado' },
  { descricao: 'Plano de Saúde', valor: 890, tipo: 'despesa', categoria: 'Saúde', conta: 'Nubank', data: '2026-02-05', status: 'realizado' },
  { descricao: 'Assinaturas', valor: 189, tipo: 'despesa', categoria: 'Assinaturas', conta: 'Nubank', data: '2026-02-01', status: 'realizado' },
  { descricao: 'Energia', valor: 195, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2026-02-10', status: 'realizado' },
  { descricao: 'Condomínio', valor: 850, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2026-02-05', status: 'realizado' },
  // January
  { descricao: 'Salário', valor: 15000, tipo: 'receita', categoria: 'Salário', conta: 'Nubank', data: '2026-01-01', status: 'realizado' },
  { descricao: 'Freelance', valor: 4200, tipo: 'receita', categoria: 'Freelance', conta: 'Nubank', data: '2026-01-12', status: 'realizado' },
  { descricao: 'Dividendos', valor: 650, tipo: 'receita', categoria: 'Investimentos', conta: 'XP', data: '2026-01-20', status: 'realizado' },
  { descricao: 'Aluguel', valor: 3200, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2026-01-01', status: 'realizado' },
  { descricao: 'Supermercado', valor: 1100, tipo: 'despesa', categoria: 'Alimentação', conta: 'Nubank', data: '2026-01-06', status: 'realizado' },
  { descricao: 'Viagem', valor: 2500, tipo: 'despesa', categoria: 'Lazer', conta: 'Inter', data: '2026-01-15', status: 'realizado' },
  { descricao: 'Plano de Saúde', valor: 890, tipo: 'despesa', categoria: 'Saúde', conta: 'Nubank', data: '2026-01-05', status: 'realizado' },
  { descricao: 'Condomínio', valor: 850, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2026-01-05', status: 'realizado' },
  // December
  { descricao: 'Salário', valor: 15000, tipo: 'receita', categoria: 'Salário', conta: 'Nubank', data: '2025-12-01', status: 'realizado' },
  { descricao: '13º Salário', valor: 15000, tipo: 'receita', categoria: 'Salário', conta: 'Nubank', data: '2025-12-20', status: 'realizado' },
  { descricao: 'Freelance', valor: 1800, tipo: 'receita', categoria: 'Freelance', conta: 'Inter', data: '2025-12-10', status: 'realizado' },
  { descricao: 'Aluguel', valor: 3100, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2025-12-01', status: 'realizado' },
  { descricao: 'Presentes Natal', valor: 3200, tipo: 'despesa', categoria: 'Lazer', conta: 'Nubank', data: '2025-12-20', status: 'realizado' },
  { descricao: 'Supermercado', valor: 1800, tipo: 'despesa', categoria: 'Alimentação', conta: 'Nubank', data: '2025-12-05', status: 'realizado' },
  { descricao: 'Condomínio', valor: 850, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2025-12-05', status: 'realizado' },
  // November
  { descricao: 'Salário', valor: 14500, tipo: 'receita', categoria: 'Salário', conta: 'Nubank', data: '2025-11-01', status: 'realizado' },
  { descricao: 'Freelance', valor: 3000, tipo: 'receita', categoria: 'Freelance', conta: 'Nubank', data: '2025-11-08', status: 'realizado' },
  { descricao: 'Aluguel', valor: 3100, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2025-11-01', status: 'realizado' },
  { descricao: 'Supermercado', valor: 1250, tipo: 'despesa', categoria: 'Alimentação', conta: 'Nubank', data: '2025-11-04', status: 'realizado' },
  { descricao: 'Condomínio', valor: 850, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2025-11-05', status: 'realizado' },
  { descricao: 'Black Friday', valor: 1500, tipo: 'despesa', categoria: 'Lazer', conta: 'Nubank', data: '2025-11-29', status: 'realizado' },
  // October
  { descricao: 'Salário', valor: 14500, tipo: 'receita', categoria: 'Salário', conta: 'Nubank', data: '2025-10-01', status: 'realizado' },
  { descricao: 'Freelance', valor: 2500, tipo: 'receita', categoria: 'Freelance', conta: 'Inter', data: '2025-10-15', status: 'realizado' },
  { descricao: 'Aluguel', valor: 3100, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2025-10-01', status: 'realizado' },
  { descricao: 'Supermercado', valor: 1180, tipo: 'despesa', categoria: 'Alimentação', conta: 'Nubank', data: '2025-10-03', status: 'realizado' },
  { descricao: 'Condomínio', valor: 850, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2025-10-05', status: 'realizado' },
  // September
  { descricao: 'Salário', valor: 14500, tipo: 'receita', categoria: 'Salário', conta: 'Nubank', data: '2025-09-01', status: 'realizado' },
  { descricao: 'Freelance', valor: 1900, tipo: 'receita', categoria: 'Freelance', conta: 'Nubank', data: '2025-09-20', status: 'realizado' },
  { descricao: 'Aluguel', valor: 3000, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2025-09-01', status: 'realizado' },
  { descricao: 'Supermercado', valor: 1100, tipo: 'despesa', categoria: 'Alimentação', conta: 'Nubank', data: '2025-09-05', status: 'realizado' },
  { descricao: 'Condomínio', valor: 850, tipo: 'despesa', categoria: 'Moradia', conta: 'Nubank', data: '2025-09-05', status: 'realizado' },
]

const metasSeed = [
  { nome: 'Reserva de Emergência', valor_atual: 45000, valor_meta: 90000, prazo: '2026-12-31', status: 'em_andamento' },
  { nome: 'Entrada Apartamento', valor_atual: 85000, valor_meta: 200000, prazo: '2027-06-30', status: 'em_andamento' },
  { nome: 'Viagem Europa', valor_atual: 12000, valor_meta: 25000, prazo: '2026-07-31', status: 'em_andamento' },
  { nome: 'Fundo Educação', valor_atual: 8500, valor_meta: 50000, prazo: '2028-12-31', status: 'em_andamento' },
  { nome: 'Carro Novo', valor_atual: 35000, valor_meta: 120000, prazo: '2027-12-31', status: 'em_andamento' },
]

const ativosSeed = [
  { nome: 'Tesouro Selic 2029', tipo: 'Renda Fixa', valor: 85000, rendimento_mes: 1.2, rendimento_acumulado: 14.5 },
  { nome: 'CDB Banco Inter', tipo: 'Renda Fixa', valor: 42000, rendimento_mes: 1.1, rendimento_acumulado: 12.8 },
  { nome: 'ITUB4', tipo: 'Ações', valor: 28000, rendimento_mes: -2.3, rendimento_acumulado: 8.5 },
  { nome: 'PETR4', tipo: 'Ações', valor: 15000, rendimento_mes: 3.8, rendimento_acumulado: 22.1 },
  { nome: 'VALE3', tipo: 'Ações', valor: 12000, rendimento_mes: 1.5, rendimento_acumulado: -5.2 },
  { nome: 'XPML11', tipo: 'FIIs', valor: 35000, rendimento_mes: 0.9, rendimento_acumulado: 10.3 },
  { nome: 'HGLG11', tipo: 'FIIs', valor: 22000, rendimento_mes: 0.8, rendimento_acumulado: 9.1 },
  { nome: 'Bitcoin', tipo: 'Crypto', valor: 18000, rendimento_mes: 12.5, rendimento_acumulado: 45.2 },
  { nome: 'Ethereum', tipo: 'Crypto', valor: 8000, rendimento_mes: 8.2, rendimento_acumulado: 32.1 },
  { nome: 'Poupança', tipo: 'Renda Fixa', valor: 15000, rendimento_mes: 0.6, rendimento_acumulado: 7.2 },
]

const orcamentosSeed = [
  { categoria: 'Moradia', limite: 5000, gasto_atual: 4390, mes: '2026-03' },
  { categoria: 'Alimentação', limite: 2500, gasto_atual: 2030, mes: '2026-03' },
  { categoria: 'Transporte', limite: 800, gasto_atual: 600, mes: '2026-03' },
  { categoria: 'Saúde', limite: 1200, gasto_atual: 1040, mes: '2026-03' },
  { categoria: 'Assinaturas', limite: 250, gasto_atual: 189, mes: '2026-03' },
  { categoria: 'Educação', limite: 500, gasto_atual: 47, mes: '2026-03' },
  { categoria: 'Lazer', limite: 1000, gasto_atual: 0, mes: '2026-03' },
]

export async function seedDatabase() {
  try {
    // Check if data already exists
    const { data: existing } = await supabase.from('transacoes').select('id').limit(1)
    if (existing && existing.length > 0) return

    // Insert seed data
    await supabase.from('transacoes').insert(transacoesSeed)
    await supabase.from('metas').insert(metasSeed)
    await supabase.from('ativos').insert(ativosSeed)
    await supabase.from('orcamentos').insert(orcamentosSeed)

    console.log('Seed data inserted successfully')
  } catch (error) {
    console.error('Error seeding database:', error)
  }
}
