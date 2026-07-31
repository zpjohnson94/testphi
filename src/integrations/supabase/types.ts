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
      battle_fake_profiles: {
        Row: {
          avatar_accessory: string
          avatar_character: string
          avatar_color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          avatar_accessory: string
          avatar_character: string
          avatar_color: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          avatar_accessory?: string
          avatar_character?: string
          avatar_color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      battle_leaderboard_alerts: {
        Row: {
          alerted_at: string
          battle_date: string
          id: string
          rank: number
          user_id: string
        }
        Insert: {
          alerted_at?: string
          battle_date: string
          id?: string
          rank: number
          user_id: string
        }
        Update: {
          alerted_at?: string
          battle_date?: string
          id?: string
          rank?: number
          user_id?: string
        }
        Relationships: []
      }
      battle_runs: {
        Row: {
          battle_date: string
          completed_at: string
          daily_rank: number | null
          event_log: Json
          fake_profile_id: string | null
          id: string
          is_fake: boolean
          opponent_run_id: string | null
          questions_correct: number
          questions_wrong: number
          result: string | null
          total_time_ms: number
          user_id: string | null
        }
        Insert: {
          battle_date: string
          completed_at?: string
          daily_rank?: number | null
          event_log?: Json
          fake_profile_id?: string | null
          id?: string
          is_fake?: boolean
          opponent_run_id?: string | null
          questions_correct?: number
          questions_wrong?: number
          result?: string | null
          total_time_ms?: number
          user_id?: string | null
        }
        Update: {
          battle_date?: string
          completed_at?: string
          daily_rank?: number | null
          event_log?: Json
          fake_profile_id?: string | null
          id?: string
          is_fake?: boolean
          opponent_run_id?: string | null
          questions_correct?: number
          questions_wrong?: number
          result?: string | null
          total_time_ms?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_runs_battle_date_fkey"
            columns: ["battle_date"]
            isOneToOne: false
            referencedRelation: "battle_sets"
            referencedColumns: ["set_date"]
          },
          {
            foreignKeyName: "battle_runs_fake_profile_id_fkey"
            columns: ["fake_profile_id"]
            isOneToOne: false
            referencedRelation: "battle_fake_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_runs_opponent_run_id_fkey"
            columns: ["opponent_run_id"]
            isOneToOne: false
            referencedRelation: "battle_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_sets: {
        Row: {
          generated_at: string
          question_ids: string[]
          set_date: string
        }
        Insert: {
          generated_at?: string
          question_ids: string[]
          set_date: string
        }
        Update: {
          generated_at?: string
          question_ids?: string[]
          set_date?: string
        }
        Relationships: []
      }
      daily_attempts: {
        Row: {
          answered_at: string | null
          correct_position: number
          created_at: string
          elapsed_ms: number | null
          id: string
          is_correct: boolean | null
          question_id: string
          selected_position: number | null
          served_at: string
          set_date: string
          shuffled_order: string[]
          slot: number
          updated_at: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          correct_position: number
          created_at?: string
          elapsed_ms?: number | null
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_position?: number | null
          served_at?: string
          set_date: string
          shuffled_order: string[]
          slot: number
          updated_at?: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          correct_position?: number
          created_at?: string
          elapsed_ms?: number | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_position?: number | null
          served_at?: string
          set_date?: string
          shuffled_order?: string[]
          slot?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_sets: {
        Row: {
          generated_at: string
          question_ids: string[]
          set_date: string
        }
        Insert: {
          generated_at?: string
          question_ids: string[]
          set_date: string
        }
        Update: {
          generated_at?: string
          question_ids?: string[]
          set_date?: string
        }
        Relationships: []
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
      question_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          question_id: string
          reason: string | null
          slot: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          question_id: string
          reason?: string | null
          slot?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          question_id?: string
          reason?: string | null
          slot?: number | null
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          diagram_group_id: string | null
          difficulty: number
          domain_id: string
          expected_seconds: number
          id: string
          is_active: boolean
          passage_group_id: string | null
          payload: Json
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagram_group_id?: string | null
          difficulty: number
          domain_id: string
          expected_seconds?: number
          id: string
          is_active?: boolean
          passage_group_id?: string | null
          payload?: Json
          source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagram_group_id?: string | null
          difficulty?: number
          domain_id?: string
          expected_seconds?: number
          id?: string
          is_active?: boolean
          passage_group_id?: string | null
          payload?: Json
          source?: string
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
      can_read_battle_run: {
        Args: { _run_id: string; _user_id: string }
        Returns: boolean
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
