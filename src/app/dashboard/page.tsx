'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  LogOut,
  Plus,
  Target,
  User,
  Filter,
  Calendar,
  Tag,
  Wallet
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  category_id?: string
  categories?: {
    name: string
    type: string
  }
}

interface DashboardData {
  totalBalance: number
  totalIncome: number
  totalExpense: number
  savingsRate: number
  recentTransactions: Transaction[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    savingsRate: 0,
    recentTransactions: [],
  })
  const [categories, setCategories] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  
  // Estados para os dialogs
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Estados para formulário de transação
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  // Estados para formulário de meta
  const [goalForm, setGoalForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    deadline: ''
  })

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth')
        return
      }

      setUser(session.user)

      // Buscar perfil do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)

      // Buscar categorias
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name')

      setCategories(categoriesData || [])

      // Buscar metas
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      setGoals(goalsData || [])

      // Buscar dados do dashboard
      await loadDashboardData(session.user.id)
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async (userId: string) => {
    try {
      // Buscar todas as transações do usuário
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*, categories(name, type)')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (error) {
        console.error('Erro ao buscar transações:', error)
        return
      }

      if (transactions) {
        // Calcular totais
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const expense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const balance = income - expense
        const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0

        setDashboardData({
          totalBalance: balance,
          totalIncome: income,
          totalExpense: expense,
          savingsRate: savingsRate,
          recentTransactions: transactions,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: profile?.currency || 'BRL',
    }).format(value)
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (submitting) return
    setSubmitting(true)
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: transactionForm.type,
          amount: parseFloat(transactionForm.amount),
          description: transactionForm.description,
          category_id: transactionForm.category_id || null,
          date: transactionForm.date
        }])
        .select()

      if (error) {
        console.error('Erro ao criar transação:', error)
        alert(`Erro ao criar transação: ${error.message}`)
        return
      }

      console.log('Transação criada com sucesso:', data)

      // Resetar formulário
      setTransactionForm({
        type: 'expense',
        amount: '',
        description: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0]
      })
      
      setTransactionDialogOpen(false)
      
      // Recarregar dados do dashboard - ATUALIZAÇÃO AUTOMÁTICA
      await loadDashboardData(user.id)
      
      alert('✅ Transação criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar transação:', error)
      alert('Erro ao criar transação. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (submitting) return
    setSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('goals')
        .insert([{
          user_id: user.id,
          name: goalForm.name,
          target_amount: parseFloat(goalForm.target_amount),
          current_amount: parseFloat(goalForm.current_amount),
          deadline: goalForm.deadline
        }])

      if (error) throw error

      // Resetar formulário
      setGoalForm({
        name: '',
        target_amount: '',
        current_amount: '0',
        deadline: ''
      })
      
      setGoalDialogOpen(false)
      
      // Recarregar metas
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setGoals(goalsData || [])
      
      alert('✅ Meta criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar meta:', error)
      alert('Erro ao criar meta. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
              <p className="text-sm text-gray-600">
                Bem-vindo, {profile?.full_name || user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Transação
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Nova Transação</DialogTitle>
                    <DialogDescription>
                      Registre uma nova receita ou despesa
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTransaction} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={transactionForm.type === 'income' ? 'default' : 'outline'}
                          onClick={() => setTransactionForm({...transactionForm, type: 'income'})}
                          className="w-full"
                        >
                          <ArrowUpRight className="w-4 h-4 mr-2" />
                          Receita
                        </Button>
                        <Button
                          type="button"
                          variant={transactionForm.type === 'expense' ? 'default' : 'outline'}
                          onClick={() => setTransactionForm({...transactionForm, type: 'expense'})}
                          className="w-full"
                        >
                          <ArrowDownRight className="w-4 h-4 mr-2" />
                          Despesa
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Input
                        id="description"
                        placeholder="Ex: Salário, Aluguel, Compras..."
                        value={transactionForm.description}
                        onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria (opcional)</Label>
                      <select
                        id="category"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={transactionForm.category_id}
                        onChange={(e) => setTransactionForm({...transactionForm, category_id: e.target.value})}
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories
                          .filter(cat => cat.type === transactionForm.type)
                          .map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        value={transactionForm.date}
                        onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setTransactionDialogOpen(false)} 
                        className="flex-1"
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          'Criar Transação'
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Target className="w-4 h-4 mr-2" />
                    Criar Meta
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Criar Meta Financeira</DialogTitle>
                    <DialogDescription>
                      Defina uma meta de economia ou investimento
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateGoal} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="goalName">Nome da Meta</Label>
                      <Input
                        id="goalName"
                        placeholder="Ex: Viagem, Carro, Reserva de Emergência..."
                        value={goalForm.name}
                        onChange={(e) => setGoalForm({...goalForm, name: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetAmount">Valor Alvo</Label>
                      <Input
                        id="targetAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={goalForm.target_amount}
                        onChange={(e) => setGoalForm({...goalForm, target_amount: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentAmount">Valor Atual (opcional)</Label>
                      <Input
                        id="currentAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={goalForm.current_amount}
                        onChange={(e) => setGoalForm({...goalForm, current_amount: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deadline">Data Limite</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={goalForm.deadline}
                        onChange={(e) => setGoalForm({...goalForm, deadline: e.target.value})}
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setGoalDialogOpen(false)} 
                        className="flex-1"
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          'Criar Meta'
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Perfil do Usuário */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle>{profile?.full_name || 'Usuário'}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Saldo Total */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Saldo Total
              </CardTitle>
              <DollarSign className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.totalBalance)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Receitas - Despesas
              </p>
            </CardContent>
          </Card>

          {/* Receitas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Receitas
              </CardTitle>
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(dashboardData.totalIncome)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total de entradas
              </p>
            </CardContent>
          </Card>

          {/* Despesas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Despesas
              </CardTitle>
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(dashboardData.totalExpense)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total de saídas
              </p>
            </CardContent>
          </Card>

          {/* Taxa de Economia */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Taxa de Economia
              </CardTitle>
              <PiggyBank className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.savingsRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Do total de receitas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Metas Financeiras */}
        {goals.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Metas Financeiras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal) => {
                  const progress = (goal.current_amount / goal.target_amount) * 100
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{goal.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extrato Completo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Extrato Completo</CardTitle>
                <CardDescription>Todas as suas transações</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData.recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Nenhuma transação registrada</p>
                <p className="text-sm text-gray-500 mb-4">
                  Comece adicionando sua primeira receita ou despesa
                </p>
                <Button onClick={() => setTransactionDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Transação
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          {transaction.categories && (
                            <>
                              <span>•</span>
                              <Tag className="w-3 h-3" />
                              {transaction.categories.name}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(Number(transaction.amount))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
