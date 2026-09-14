// Généré à partir du schéma réel du projet Supabase "Reflet" (nmzpskxclwcqnkmkpqkh).
// Régénère avec `npx supabase gen types typescript --project-id nmzpskxclwcqnkmkpqkh`
// dès que le schéma évolue.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
        }
        Update: { [key: string]: any }
      }
      brands: {
        Row: {
          id: string
          owner_id: string
          name: string
          website_url: string | null
          plan: 'trial' | 'active' | 'past_due' | 'canceled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          website_url?: string | null
          plan?: 'trial' | 'active' | 'past_due' | 'canceled'
          created_at?: string
          updated_at?: string
        }
        Update: { [key: string]: any }
      }
      questions: {
        Row: {
          id: string
          brand_id: string
          text: string
          active: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          text: string
          active?: boolean
          position?: number
          created_at?: string
        }
        Update: { [key: string]: any }
      }
      measurement_runs: {
        Row: {
          id: string
          brand_id: string
          status: 'pending' | 'measuring' | 'partial' | 'success' | 'failed'
          started_at: string
          completed_at: string | null
          questions_total: number
          questions_completed: number
          score: number | null
          score_delta: number | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          status?: 'pending' | 'measuring' | 'partial' | 'success' | 'failed'
          started_at?: string
          completed_at?: string | null
          questions_total?: number
          questions_completed?: number
          score?: number | null
          score_delta?: number | null
          created_at?: string
        }
        Update: { [key: string]: any }
      }
      observations: {
        Row: {
          id: string
          run_id: string
          question_id: string
          engine: string
          brand_mentioned: boolean
          brand_recommended: boolean
          brand_position: number | null
          raw_answer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          run_id: string
          question_id: string
          engine?: string
          brand_mentioned?: boolean
          brand_recommended?: boolean
          brand_position?: number | null
          raw_answer?: string | null
          created_at?: string
        }
        Update: { [key: string]: any }
      }
      competitors: {
        Row: {
          id: string
          brand_id: string
          name: string
          hidden: boolean
          first_seen_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          hidden?: boolean
          first_seen_at?: string
        }
        Update: { [key: string]: any }
      }
      observation_competitors: {
        Row: {
          id: string
          observation_id: string
          competitor_id: string
          mentioned: boolean
          recommended: boolean
          position: number | null
          context_excerpt: string | null
        }
        Insert: {
          id?: string
          observation_id: string
          competitor_id: string
          mentioned?: boolean
          recommended?: boolean
          position?: number | null
          context_excerpt?: string | null
        }
        Update: { [key: string]: any }
      }
      opportunities: {
        Row: {
          id: string
          brand_id: string
          title: string
          priority: 'low' | 'medium' | 'high'
          confidence: number
          status: 'open' | 'resolved' | 'dismissed' | 'no_longer_observed'
          observations_count: number
          reason: string
          current_site_content: string | null
          proposed_direction: string
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          brand_id: string
          title: string
          priority: 'low' | 'medium' | 'high'
          confidence?: number
          status?: 'open' | 'resolved' | 'dismissed' | 'no_longer_observed'
          observations_count?: number
          reason: string
          current_site_content?: string | null
          proposed_direction: string
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: { [key: string]: any }
      }
      opportunity_questions: {
        Row: { opportunity_id: string; question_id: string }
        Insert: { opportunity_id: string; question_id: string }
        Update: { [key: string]: any }
      }
      opportunity_evidence: {
        Row: {
          id: string
          opportunity_id: string
          step_order: number
          step_type: 'question' | 'response' | 'observation' | 'competitor' | 'site' | 'gap' | 'recommendation'
          label: string
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          step_order: number
          step_type: 'question' | 'response' | 'observation' | 'competitor' | 'site' | 'gap' | 'recommendation'
          label: string
          content?: string | null
          created_at?: string
        }
        Update: { [key: string]: any }
      }
      site_pages: {
        Row: {
          id: string
          brand_id: string
          url: string
          status: 'unchecked' | 'ok' | 'stale' | 'unavailable'
          last_checked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          url: string
          status?: 'unchecked' | 'ok' | 'stale' | 'unavailable'
          last_checked_at?: string | null
          created_at?: string
        }
        Update: { [key: string]: any }
      }
      site_changes: {
        Row: {
          id: string
          brand_id: string
          page_id: string
          detected_at: string
          change_type: string
          importance: 'low' | 'medium' | 'high'
          confidence: number
          detection_method: string
          before_snippet: string | null
          after_snippet: string | null
          linked_run_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          page_id: string
          detected_at?: string
          change_type: string
          importance: 'low' | 'medium' | 'high'
          confidence?: number
          detection_method: string
          before_snippet?: string | null
          after_snippet?: string | null
          linked_run_id?: string | null
          created_at?: string
        }
        Update: { [key: string]: any }
      }
      events: {
        Row: {
          id: string
          brand_id: string
          type: 'success' | 'info' | 'warning' | 'error'
          title: string
          message: string | null
          source_type: 'measurement_run' | 'site_change' | 'opportunity' | 'system' | 'billing'
          source_id: string | null
          show_toast: boolean
          show_notification: boolean
          show_history: boolean
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          type: 'success' | 'info' | 'warning' | 'error'
          title: string
          message?: string | null
          source_type: 'measurement_run' | 'site_change' | 'opportunity' | 'system' | 'billing'
          source_id?: string | null
          show_toast?: boolean
          show_notification?: boolean
          show_history?: boolean
          read?: boolean
          created_at?: string
        }
        Update: { [key: string]: any }
      }
      notification_preferences: {
        Row: {
          id: string
          brand_id: string
          email_enabled: boolean
          notify_measurement_run: boolean
          notify_site_change: boolean
          notify_opportunity: boolean
          notify_billing: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          email_enabled?: boolean
          notify_measurement_run?: boolean
          notify_site_change?: boolean
          notify_opportunity?: boolean
          notify_billing?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: { [key: string]: any }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
