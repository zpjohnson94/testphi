export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answered_at: string
          correct: boolean
          difficulty: number
          domain_id: string
          elapsed_seconds: number
          id: string
          is_bonus: boolean
          question_id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          answered_at?: string
          correct: boolean
          difficulty: number
          domain_id: string
          elapsed_seconds: number
          id?: string
          is_bonus?: boolean
          question_id: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          answered_at?: string
          correct?: boolean
          difficulty?: number
          domain_id?: string
          elapsed_seconds?: number
          id?: string
          is_bonus?: boolean
          question_id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          plan: string
          updated_at: string
        }
        Insert: {
          avatar_id?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          plan?: string
          updated_at?: string
        }
        Update: {
          avatar_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          difficulty: number
          domain_id: string
          expected_seconds: number
          id: string
          payload: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty: number
          domain_id: string
          expected_seconds?: number
          id: string
          payload?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: number
          domain_id?: string
          expected_seconds?: number
          id?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          delta: number | null
          id: string
          kind: string
          momentum_after: number | null
          momentum_before: number | null
          new_overall: number | null
          prev_overall: number | null
          started_at: string
          streak_after: number | null
          streak_before: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          delta?: number | null
          id?: string
          kind: string
          momentum_after?: number | null
          momentum_before?: number | null
          new_overall?: number | null
          prev_overall?: number | null
          started_at?: string
          streak_after?: number | null
          streak_before?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          delta?: number | null
          id?: string
          kind?: string
          momentum_after?: number | null
          momentum_before?: number | null
          new_overall?: number | null
          prev_overall?: number | null
          started_at?: string
          streak_after?: number | null
          streak_before?: number | null
          user_id?: string
        }
        Relationships: []
      }
      signups: {
        Row: {
          billing: string | null
          created_at: string
          diagnostic_score: Json | null
          email: string
          id: string
          ip_address: string | null
          name: string | null
          notify_opt_in: boolean | null
          plan: string | null
          referrer: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          billing?: string | null
          created_at?: string
          diagnostic_score?: Json | null
          email: string
          id?: string
          ip_address?: string | null
          name?: string | null
          notify_opt_in?: boolean | null
          plan?: string | null
          referrer?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          billing?: string | null
          created_at?: string
          diagnostic_score?: Json | null
          email?: string
          id?: string
          ip_address?: string | null
          name?: string | null
          notify_opt_in?: boolean | null
          plan?: string | null
          referrer?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      user_domain_mastery: {
        Row: {
          answered: number
          batch: Json
          bonus_step: number
          created_at: string
          domain_id: string
          initialized: boolean
          last_answered_at: string | null
          mastery: number
          updated_at: string
          user_id: string
        }
        Insert: {
          answered?: number
          batch?: Json
          bonus_step?: number
          created_at?: string
          domain_id: string
          initialized?: boolean
          last_answered_at?: string | null
          mastery?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          answered?: number
          batch?: Json
          bonus_step?: number
          created_at?: string
          domain_id?: string
          initialized?: boolean
          last_answered_at?: string | null
          mastery?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_scoring_state: {
        Row: {
          created_at: string
          diagnostic_score: number
          last_daily_date: string | null
          last_momentum_date: string | null
          momentum_needle: number
          qualifying_days: Json
          seeded: boolean
          streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnostic_score?: number
          last_daily_date?: string | null
          last_momentum_date?: string | null
          momentum_needle?: number
          qualifying_days?: Json
          seeded?: boolean
          streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnostic_score?: number
          last_daily_date?: string | null
          last_momentum_date?: string | null
          momentum_needle?: number
          qualifying_days?: Json
          seeded?: boolean
          streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
