// GÉNÉRÉ depuis le schéma Supabase réel du projet Reflet (nmzpskxclwcqnkmkpqkh).
// Ne pas éditer à la main — régénérer via `Supabase:generate_typescript_types`
// (ou `supabase gen types typescript`) après chaque migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          plan: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          plan?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          plan?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          brand_id: string
          first_seen_at: string
          hidden: boolean
          id: string
          name: string
        }
        Insert: {
          brand_id: string
          first_seen_at?: string
          hidden?: boolean
          id?: string
          name: string
        }
        Update: {
          brand_id?: string
          first_seen_at?: string
          hidden?: boolean
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitors_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          message: string | null
          read: boolean
          show_history: boolean
          show_notification: boolean
          show_toast: boolean
          source_id: string | null
          source_type: string
          title: string
          type: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          show_history?: boolean
          show_notification?: boolean
          show_toast?: boolean
          source_id?: string | null
          source_type: string
          title: string
          type: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          show_history?: boolean
          show_notification?: boolean
          show_toast?: boolean
          source_id?: string | null
          source_type?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_runs: {
        Row: {
          brand_id: string
          completed_at: string | null
          created_at: string
          id: string
          questions_completed: number
          questions_total: number
          score: number | null
          score_delta: number | null
          started_at: string
          status: string
        }
        Insert: {
          brand_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          questions_completed?: number
          questions_total?: number
          score?: number | null
          score_delta?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          brand_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          questions_completed?: number
          questions_total?: number
          score?: number | null
          score_delta?: number | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_runs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      observation_competitors: {
        Row: {
          competitor_id: string
          context_excerpt: string | null
          id: string
          mentioned: boolean
          observation_id: string
          position: number | null
          recommended: boolean
        }
        Insert: {
          competitor_id: string
          context_excerpt?: string | null
          id?: string
          mentioned?: boolean
          observation_id: string
          position?: number | null
          recommended?: boolean
        }
        Update: {
          competitor_id?: string
          context_excerpt?: string | null
          id?: string
          mentioned?: boolean
          observation_id?: string
          position?: number | null
          recommended?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "observation_competitors_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observation_competitors_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          brand_mentioned: boolean
          brand_position: number | null
          brand_recommended: boolean
          created_at: string
          engine: string
          id: string
          question_id: string
          raw_answer: string | null
          run_id: string
        }
        Insert: {
          brand_mentioned?: boolean
          brand_position?: number | null
          brand_recommended?: boolean
          created_at?: string
          engine?: string
          id?: string
          question_id: string
          raw_answer?: string | null
          run_id: string
        }
        Update: {
          brand_mentioned?: boolean
          brand_position?: number | null
          brand_recommended?: boolean
          created_at?: string
          engine?: string
          id?: string
          question_id?: string
          raw_answer?: string | null
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observations_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "measurement_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          brand_id: string
          confidence: number
          created_at: string
          current_site_content: string | null
          id: string
          observations_count: number
          priority: string
          proposed_direction: string
          reason: string
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          confidence?: number
          created_at?: string
          current_site_content?: string | null
          id?: string
          observations_count?: number
          priority: string
          proposed_direction: string
          reason: string
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          confidence?: number
          created_at?: string
          current_site_content?: string | null
          id?: string
          observations_count?: number
          priority?: string
          proposed_direction?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_evidence: {
        Row: {
          content: string | null
          created_at: string
          id: string
          label: string
          opportunity_id: string
          step_order: number
          step_type: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          label: string
          opportunity_id: string
          step_order: number
          step_type: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          label?: string
          opportunity_id?: string
          step_order?: number
          step_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_evidence_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_questions: {
        Row: {
          opportunity_id: string
          question_id: string
        }
        Insert: {
          opportunity_id: string
          question_id: string
        }
        Update: {
          opportunity_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_questions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          active: boolean
          brand_id: string
          created_at: string
          id: string
          position: number
          text: string
        }
        Insert: {
          active?: boolean
          brand_id: string
          created_at?: string
          id?: string
          position?: number
          text: string
        }
        Update: {
          active?: boolean
          brand_id?: string
          created_at?: string
          id?: string
          position?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      site_changes: {
        Row: {
          after_snippet: string | null
          before_snippet: string | null
          brand_id: string
          change_type: string
          confidence: number
          created_at: string
          detected_at: string
          detection_method: string
          id: string
          importance: string
          linked_run_id: string | null
          page_id: string
        }
        Insert: {
          after_snippet?: string | null
          before_snippet?: string | null
          brand_id: string
          change_type: string
          confidence?: number
          created_at?: string
          detected_at?: string
          detection_method: string
          id?: string
          importance: string
          linked_run_id?: string | null
          page_id: string
        }
        Update: {
          after_snippet?: string | null
          before_snippet?: string | null
          brand_id?: string
          change_type?: string
          confidence?: number
          created_at?: string
          detected_at?: string
          detection_method?: string
          id?: string
          importance?: string
          linked_run_id?: string | null
          page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_changes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_changes_linked_run_id_fkey"
            columns: ["linked_run_id"]
            isOneToOne: false
            referencedRelation: "measurement_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_changes_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          last_checked_at: string | null
          status: string
          url: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          last_checked_at?: string | null
          status?: string
          url: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          last_checked_at?: string | null
          status?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_pages_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
