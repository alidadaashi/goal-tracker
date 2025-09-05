import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      goals: {
        Row: {
          id: string
          user_id: string
          period: 'yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily'
          goal_id: string
          text: string
          type: 'signal' | 'noise'
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period: 'yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily'
          goal_id: string
          text: string
          type: 'signal' | 'noise'
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          period?: 'yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily'
          goal_id?: string
          text?: string
          type?: 'signal' | 'noise'
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      column_visibility: {
        Row: {
          id: string
          user_id: string
          period: 'yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily'
          is_blurred: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period: 'yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily'
          is_blurred?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          period?: 'yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily'
          is_blurred?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}