import { supabase } from './supabase'

// Categorias padrão para novos usuários
const DEFAULT_CATEGORIES = {
  income: [
    { name: 'Salário', color: '#10B981', icon: 'Briefcase' },
    { name: 'Freelance', color: '#3B82F6', icon: 'Code' },
    { name: 'Investimentos', color: '#8B5CF6', icon: 'TrendingUp' },
    { name: 'Outros', color: '#6B7280', icon: 'DollarSign' },
  ],
  expense: [
    { name: 'Alimentação', color: '#EF4444', icon: 'UtensilsCrossed' },
    { name: 'Transporte', color: '#F59E0B', icon: 'Car' },
    { name: 'Moradia', color: '#EC4899', icon: 'Home' },
    { name: 'Saúde', color: '#14B8A6', icon: 'Heart' },
    { name: 'Educação', color: '#6366F1', icon: 'GraduationCap' },
    { name: 'Lazer', color: '#8B5CF6', icon: 'Gamepad2' },
    { name: 'Compras', color: '#F97316', icon: 'ShoppingBag' },
    { name: 'Contas', color: '#64748B', icon: 'FileText' },
    { name: 'Outros', color: '#6B7280', icon: 'MoreHorizontal' },
  ],
}

export async function initializeUserData(userId: string, email: string) {
  try {
    // 1. Criar perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: email.split('@')[0], // Nome inicial baseado no email
        currency: 'BRL',
      })

    if (profileError && profileError.code !== '23505') { // Ignora erro de duplicação
      console.error('Erro ao criar perfil:', profileError)
      throw profileError
    }

    // 2. Criar configurações do usuário
    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        theme: 'light',
        language: 'pt-BR',
        notifications_enabled: true,
        email_notifications: true,
        budget_alerts: true,
        goal_reminders: true,
      })

    if (settingsError && settingsError.code !== '23505') {
      console.error('Erro ao criar configurações:', settingsError)
    }

    // 3. Criar categorias padrão de receita
    const incomeCategories = DEFAULT_CATEGORIES.income.map(cat => ({
      user_id: userId,
      name: cat.name,
      type: 'income' as const,
      color: cat.color,
      icon: cat.icon,
    }))

    const { error: incomeCatError } = await supabase
      .from('categories')
      .insert(incomeCategories)

    if (incomeCatError && incomeCatError.code !== '23505') {
      console.error('Erro ao criar categorias de receita:', incomeCatError)
    }

    // 4. Criar categorias padrão de despesa
    const expenseCategories = DEFAULT_CATEGORIES.expense.map(cat => ({
      user_id: userId,
      name: cat.name,
      type: 'expense' as const,
      color: cat.color,
      icon: cat.icon,
    }))

    const { error: expenseCatError } = await supabase
      .from('categories')
      .insert(expenseCategories)

    if (expenseCatError && expenseCatError.code !== '23505') {
      console.error('Erro ao criar categorias de despesa:', expenseCatError)
    }

    console.log('✅ Dados do usuário inicializados com sucesso!')
    return { success: true }
  } catch (error) {
    console.error('Erro ao inicializar dados do usuário:', error)
    return { success: false, error }
  }
}
