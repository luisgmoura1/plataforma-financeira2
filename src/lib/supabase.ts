import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          type: 'income' | 'expense'
          amount: number
          description: string | null
          date: string
          payment_method: string | null
          tags: string[] | null
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          color: string
          icon: string | null
          created_at: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          period: string
          start_date: string
          end_date: string | null
          alert_threshold: number
          created_at: string
          updated_at: string
        }
      }
      financial_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          deadline: string | null
          category: string | null
          priority: string | null
          status: string
          created_at: string
          updated_at: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          language: string
          notifications_enabled: boolean
          email_notifications: boolean
          budget_alerts: boolean
          goal_reminders: boolean
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
