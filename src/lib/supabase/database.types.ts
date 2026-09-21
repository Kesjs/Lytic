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
      api_usage_log: {
        Row: {
          brand_id: string
          call_type: string
          created_at: string
          estimated_cost_usd: number
          id: string
          model: string
          tokens_input: number
          tokens_output: number
          user_id: string
        }
        Insert: {
          brand_id: string
          call_type: string
          created_at?: string
          estimated_cost_usd?: number
          id?: string
          model: string
          tokens_input?: number
          tokens_output?: number
          user_id: string
        }
        Update: {
          brand_id?: string
          call_type?: string
          created_at?: string
          estimated_cost_usd?: number
          id?: string
          model?: string
          tokens_input?: number
          tokens_output?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_log_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_bot_access: {
        Row: {
          bot_rules: Json
          brand_id: string
          checked_at: string
          created_at: string
          id: string
          llms_txt_found: boolean
        }
        Insert: {
          bot_rules?: Json
          brand_id: string
          checked_at?: string
          created_at?: string
          id?: string
          llms_txt_found?: boolean
        }
        Update: {
          bot_rules?: Json
          brand_id?: string
          checked_at?: string
          created_at?: string
          id?: string
          llms_txt_found?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "brand_bot_access_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
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
          linked_change_id: string | null
          questions_completed: number
          questions_total: number
          score: number | null
          score_delta: number | null
          started_at: string
          status: string
          triggered_by: string
        }
        Insert: {
          brand_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          linked_change_id?: string | null
          questions_completed?: number
          questions_total?: number
          score?: number | null
          score_delta?: number | null
          started_at?: string
          status?: string
          triggered_by?: string
        }
        Update: {
          brand_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          linked_change_id?: string | null
          questions_completed?: number
          questions_total?: number
          score?: number | null
          score_delta?: number | null
          started_at?: string
          status?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_runs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_runs_linked_change_id_fkey"
            columns: ["linked_change_id"]
            isOneToOne: false
            referencedRelation: "site_changes"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          brand_id: string
          created_at: string
          email_enabled: boolean
          id: string
          notify_billing: boolean
          notify_measurement_run: boolean
          notify_opportunity: boolean
          notify_site_change: boolean
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          email_enabled?: boolean
          id?: string
          notify_billing?: boolean
          notify_measurement_run?: boolean
          notify_opportunity?: boolean
          notify_site_change?: boolean
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          email_enabled?: boolean
          id?: string
          notify_billing?: boolean
          notify_measurement_run?: boolean
          notify_opportunity?: boolean
          notify_site_change?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
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
      observation_samples: {
        Row: {
          brand_mentioned: boolean
          brand_position: number | null
          brand_recommended: boolean
          created_at: string
          engine: string
          id: string
          observation_id: string
          raw_answer: string | null
          sample_index: number
        }
        Insert: {
          brand_mentioned?: boolean
          brand_position?: number | null
          brand_recommended?: boolean
          created_at?: string
          engine?: string
          id?: string
          observation_id: string
          raw_answer?: string | null
          sample_index: number
        }
        Update: {
          brand_mentioned?: boolean
          brand_position?: number | null
          brand_recommended?: boolean
          created_at?: string
          engine?: string
          id?: string
          observation_id?: string
          raw_answer?: string | null
          sample_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "observation_samples_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          agreement_score: number | null
          brand_mentioned: boolean
          brand_position: number | null
          brand_recommended: boolean
          created_at: string
          engine: string
          id: string
          question_id: string
          raw_answer: string | null
          run_id: string
          samples_count: number
          themes: string[]
        }
        Insert: {
          agreement_score?: number | null
          brand_mentioned?: boolean
          brand_position?: number | null
          brand_recommended?: boolean
          created_at?: string
          engine?: string
          id?: string
          question_id: string
          raw_answer?: string | null
          run_id: string
          samples_count?: number
          themes?: string[]
        }
        Update: {
          agreement_score?: number | null
          brand_mentioned?: boolean
          brand_position?: number | null
          brand_recommended?: boolean
          created_at?: string
          engine?: string
          id?: string
          question_id?: string
          raw_answer?: string | null
          run_id?: string
          samples_count?: number
          themes?: string[]
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
      opportunity_actionable_content: {
        Row: {
          content: string
          created_at: string
          filename: string | null
          id: string
          instructions: string | null
          label: string
          opportunity_id: string
          plan: string
          source_content_hash: string | null
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          filename?: string | null
          id?: string
          instructions?: string | null
          label: string
          opportunity_id: string
          plan?: string
          source_content_hash?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          filename?: string | null
          id?: string
          instructions?: string | null
          label?: string
          opportunity_id?: string
          plan?: string
          source_content_hash?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_actionable_content_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "opportunities"
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
          is_admin: boolean
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
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
      signup_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string
          user_id?: string | null
        }
        Relationships: []
      }
      site_changes: {
        Row: {
          after_snippet: string | null
          before_snippet: string | null
          brand_id: string
          change_type: string
          changed_fields: string[] | null
          confidence: number
          crawl_run_id: string | null
          created_at: string
          detected_at: string
          detection_method: string
          id: string
          importance: string
          linked_run_id: string | null
          new_content: Json | null
          old_content: Json | null
          page_id: string
        }
        Insert: {
          after_snippet?: string | null
          before_snippet?: string | null
          brand_id: string
          change_type: string
          changed_fields?: string[] | null
          confidence?: number
          crawl_run_id?: string | null
          created_at?: string
          detected_at?: string
          detection_method: string
          id?: string
          importance: string
          linked_run_id?: string | null
          new_content?: Json | null
          old_content?: Json | null
          page_id: string
        }
        Update: {
          after_snippet?: string | null
          before_snippet?: string | null
          brand_id?: string
          change_type?: string
          changed_fields?: string[] | null
          confidence?: number
          crawl_run_id?: string | null
          created_at?: string
          detected_at?: string
          detection_method?: string
          id?: string
          importance?: string
          linked_run_id?: string | null
          new_content?: Json | null
          old_content?: Json | null
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
            foreignKeyName: "site_changes_crawl_run_id_fkey"
            columns: ["crawl_run_id"]
            isOneToOne: false
            referencedRelation: "site_crawl_runs"
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
      site_crawl_runs: {
        Row: {
          brand_id: string
          completed_at: string | null
          crawl_delay_ms: number
          created_at: string
          id: string
          pages_changed: number
          pages_checked: number
          pages_total: number
          started_at: string
          status: string
          updated_at: string
          version_number: number | null
        }
        Insert: {
          brand_id: string
          completed_at?: string | null
          crawl_delay_ms?: number
          created_at?: string
          id?: string
          pages_changed?: number
          pages_checked?: number
          pages_total?: number
          started_at?: string
          status?: string
          updated_at?: string
          version_number?: number | null
        }
        Update: {
          brand_id?: string
          completed_at?: string | null
          crawl_delay_ms?: number
          created_at?: string
          id?: string
          pages_changed?: number
          pages_checked?: number
          pages_total?: number
          started_at?: string
          status?: string
          updated_at?: string
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "site_crawl_runs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          body_hash: string | null
          brand_id: string
          consecutive_failures: number
          created_at: string
          cta_hash: string | null
          extracted_content: Json | null
          headings_hash: string | null
          id: string
          is_spa: boolean | null
          last_checked_at: string | null
          links_hash: string | null
          meta_hash: string | null
          pricing_hash: string | null
          status: string
          structure_hash: string | null
          title_hash: string | null
          url: string
        }
        Insert: {
          body_hash?: string | null
          brand_id: string
          consecutive_failures?: number
          created_at?: string
          cta_hash?: string | null
          extracted_content?: Json | null
          headings_hash?: string | null
          id?: string
          is_spa?: boolean | null
          last_checked_at?: string | null
          links_hash?: string | null
          meta_hash?: string | null
          pricing_hash?: string | null
          status?: string
          structure_hash?: string | null
          title_hash?: string | null
          url: string
        }
        Update: {
          body_hash?: string | null
          brand_id?: string
          consecutive_failures?: number
          created_at?: string
          cta_hash?: string | null
          extracted_content?: Json | null
          headings_hash?: string | null
          id?: string
          is_spa?: boolean | null
          last_checked_at?: string | null
          links_hash?: string | null
          meta_hash?: string | null
          pricing_hash?: string | null
          status?: string
          structure_hash?: string | null
          title_hash?: string | null
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
      close_crawl_run: {
        Args: { p_brand_id: string; p_run_id: string }
        Returns: {
          brand_id: string
          completed_at: string | null
          crawl_delay_ms: number
          created_at: string
          id: string
          pages_changed: number
          pages_checked: number
          pages_total: number
          started_at: string
          status: string
          updated_at: string
          version_number: number | null
        }
        SetofOptions: {
          from: "*"
          to: "site_crawl_runs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
