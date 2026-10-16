/**
 * Database types — GENERATED from supabase/migrations. Do not edit by hand.
 *
 * Regenerated whenever a migration is added, so this always matches what is actually in the
 * database. Anything written here by hand is lost on the next migration.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          name: string;
          monthly_limit: number;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          category_id?: string | null;
          name: string;
          monthly_limit?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          name?: string;
          monthly_limit?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          name: string;
          color: string;
          emoji?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      savings_goals: {
        Row: {
          id: string;
          monthly_goal: number;
          monthly_income: number;
          daily_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          monthly_goal?: number;
          monthly_income?: number;
          daily_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          monthly_goal?: number;
          monthly_income?: number;
          daily_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          description: string;
          type: 'income' | 'expense';
          is_debt: boolean;
          spent_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          category_id?: string | null;
          amount: number;
          description: string;
          type: 'income' | 'expense';
          is_debt?: boolean;
          spent_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          amount?: number;
          description?: string;
          type?: 'income' | 'expense';
          is_debt?: boolean;
          spent_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type Budget = Database['public']['Tables']['budgets']['Row'];
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
export type SavingsGoal = Database['public']['Tables']['savings_goals']['Row'];
export type SavingsGoalInsert = Database['public']['Tables']['savings_goals']['Insert'];
