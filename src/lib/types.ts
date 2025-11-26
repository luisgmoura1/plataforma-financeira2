// Tipos para transações financeiras
export interface Transaction {
  id: number
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  status: 'completed' | 'pending' | 'cancelled'
}

// Tipos para categorias de gastos
export interface Category {
  id: number
  name: string
  budget: number
  spent: number
  color: string
  icon?: string
}

// Tipos para metas financeiras
export interface FinancialGoal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  category: string
}

// Tipos para dados de dashboard
export interface DashboardData {
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  savingsRate: number
  monthlyData: MonthlyData[]
  categoryData: Category[]
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
  savings: number
}

// Tipos para configurações do usuário
export interface UserSettings {
  id: number
  name: string
  email: string
  currency: string
  savingsGoal: number
  emergencyFund: number
  notifications: {
    budgetAlerts: boolean
    monthlyReports: boolean
    goalReminders: boolean
  }
}

// Tipos para filtros
export interface TransactionFilters {
  type?: 'income' | 'expense' | 'all'
  category?: string
  dateRange?: {
    start: string
    end: string
  }
  amountRange?: {
    min: number
    max: number
  }
}