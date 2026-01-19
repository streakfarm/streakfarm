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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_config: {
        Row: {
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      badges: {
        Row: {
          available_from: string | null
          available_until: string | null
          badge_category: Database["public"]["Enums"]["badge_category"]
          can_convert_to_nft: boolean | null
          created_at: string | null
          current_supply: number | null
          description: string | null
          icon_emoji: string
          id: string
          image_url: string | null
          is_active: boolean | null
          max_supply: number | null
          multiplier: number
          name: string
          rarity: Database["public"]["Enums"]["badge_rarity"]
          requirements: Json | null
          sort_order: number | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          badge_category: Database["public"]["Enums"]["badge_category"]
          can_convert_to_nft?: boolean | null
          created_at?: string | null
          current_supply?: number | null
          description?: string | null
          icon_emoji: string
          id: string
          image_url?: string | null
          is_active?: boolean | null
          max_supply?: number | null
          multiplier?: number
          name: string
          rarity?: Database["public"]["Enums"]["badge_rarity"]
          requirements?: Json | null
          sort_order?: number | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          badge_category?: Database["public"]["Enums"]["badge_category"]
          can_convert_to_nft?: boolean | null
          created_at?: string | null
          current_supply?: number | null
          description?: string | null
          icon_emoji?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_supply?: number | null
          multiplier?: number
          name?: string
          rarity?: Database["public"]["Enums"]["badge_rarity"]
          requirements?: Json | null
          sort_order?: number | null
        }
        Relationships: []
      }
      boxes: {
        Row: {
          base_points: number
          created_at: string | null
          expires_at: string
          final_points: number | null
          generated_at: string | null
          id: string
          is_expired: boolean | null
          multiplier_applied: number | null
          opened_at: string | null
          rarity: Database["public"]["Enums"]["box_rarity"]
          user_id: string
        }
        Insert: {
          base_points: number
          created_at?: string | null
          expires_at: string
          final_points?: number | null
          generated_at?: string | null
          id?: string
          is_expired?: boolean | null
          multiplier_applied?: number | null
          opened_at?: string | null
          rarity?: Database["public"]["Enums"]["box_rarity"]
          user_id: string
        }
        Update: {
          base_points?: number
          created_at?: string | null
          expires_at?: string
          final_points?: number | null
          generated_at?: string | null
          id?: string
          is_expired?: boolean | null
          multiplier_applied?: number | null
          opened_at?: string | null
          rarity?: Database["public"]["Enums"]["box_rarity"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boxes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboards: {
        Row: {
          badge_count: number | null
          id: string
          points_all_time: number | null
          points_weekly: number | null
          rank_all_time: number | null
          rank_badges: number | null
          rank_referrals: number | null
          rank_weekly: number | null
          referral_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badge_count?: number | null
          id?: string
          points_all_time?: number | null
          points_weekly?: number | null
          rank_all_time?: number | null
          rank_badges?: number | null
          rank_referrals?: number | null
          rank_weekly?: number | null
          referral_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badge_count?: number | null
          id?: string
          points_all_time?: number | null
          points_weekly?: number | null
          rank_all_time?: number | null
          rank_badges?: number | null
          rank_referrals?: number | null
          rank_weekly?: number | null
          referral_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          bots_reported: number | null
          created_at: string | null
          fingerprint: string | null
          first_name: string | null
          flag_reason: string | null
          id: string
          ip_address: unknown
          is_banned: boolean | null
          is_bot: boolean | null
          is_flagged: boolean | null
          language_code: string | null
          last_active_at: string | null
          last_checkin: string | null
          multiplier_permanent: number | null
          raw_points: number | null
          ref_code: string | null
          referred_by: string | null
          report_count: number | null
          streak_best: number | null
          streak_current: number | null
          telegram_id: number | null
          total_boxes_opened: number | null
          total_referrals: number | null
          total_tasks_completed: number | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
          username: string | null
          wallet_address: string | null
          wallet_connected_at: string | null
          wallet_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          bots_reported?: number | null
          created_at?: string | null
          fingerprint?: string | null
          first_name?: string | null
          flag_reason?: string | null
          id?: string
          ip_address?: unknown
          is_banned?: boolean | null
          is_bot?: boolean | null
          is_flagged?: boolean | null
          language_code?: string | null
          last_active_at?: string | null
          last_checkin?: string | null
          multiplier_permanent?: number | null
          raw_points?: number | null
          ref_code?: string | null
          referred_by?: string | null
          report_count?: number | null
          streak_best?: number | null
          streak_current?: number | null
          telegram_id?: number | null
          total_boxes_opened?: number | null
          total_referrals?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
          username?: string | null
          wallet_address?: string | null
          wallet_connected_at?: string | null
          wallet_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          bots_reported?: number | null
          created_at?: string | null
          fingerprint?: string | null
          first_name?: string | null
          flag_reason?: string | null
          id?: string
          ip_address?: unknown
          is_banned?: boolean | null
          is_bot?: boolean | null
          is_flagged?: boolean | null
          language_code?: string | null
          last_active_at?: string | null
          last_checkin?: string | null
          multiplier_permanent?: number | null
          raw_points?: number | null
          ref_code?: string | null
          referred_by?: string | null
          report_count?: number | null
          streak_best?: number | null
          streak_current?: number | null
          telegram_id?: number | null
          total_boxes_opened?: number | null
          total_referrals?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
          username?: string | null
          wallet_address?: string | null
          wallet_connected_at?: string | null
          wallet_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          is_valid: boolean | null
          referee_bonus: number | null
          referee_id: string
          referrer_bonus: number | null
          referrer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          referee_bonus?: number | null
          referee_id: string
          referrer_bonus?: number | null
          referrer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          referee_bonus?: number | null
          referee_id?: string
          referrer_bonus?: number | null
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          completed_at: string | null
          id: string
          is_verified: boolean | null
          points_awarded: number
          task_id: string
          user_id: string
          verification_data: Json | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          is_verified?: boolean | null
          points_awarded?: number
          task_id: string
          user_id: string
          verification_data?: Json | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_verified?: boolean | null
          points_awarded?: number
          task_id?: string
          user_id?: string
          verification_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          available_from: string | null
          available_until: string | null
          created_at: string | null
          description: string | null
          icon_emoji: string | null
          id: string
          is_repeatable: boolean | null
          max_completions: number | null
          points_reward: number
          repeat_interval_hours: number | null
          requirements: Json | null
          requires_wallet: boolean | null
          sort_order: number | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          verification_type: string | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string | null
          description?: string | null
          icon_emoji?: string | null
          id: string
          is_repeatable?: boolean | null
          max_completions?: number | null
          points_reward?: number
          repeat_interval_hours?: number | null
          requirements?: Json | null
          requires_wallet?: boolean | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          verification_type?: string | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          is_repeatable?: boolean | null
          max_completions?: number | null
          points_reward?: number
          repeat_interval_hours?: number | null
          requirements?: Json | null
          requires_wallet?: boolean | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          verification_type?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          converted_at: string | null
          converted_to_nft: boolean | null
          earned_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          nft_address: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          converted_at?: string | null
          converted_to_nft?: boolean | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          nft_address?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          converted_at?: string | null
          converted_to_nft?: boolean | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          nft_address?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string | null
          raw_points: number | null
          ref_code: string | null
          streak_best: number | null
          streak_current: number | null
          total_boxes_opened: number | null
          total_referrals: number | null
          total_tasks_completed: number | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          raw_points?: number | null
          ref_code?: string | null
          streak_best?: number | null
          streak_current?: number | null
          total_boxes_opened?: number | null
          total_referrals?: number | null
          total_tasks_completed?: number | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          raw_points?: number | null
          ref_code?: string | null
          streak_best?: number | null
          streak_current?: number | null
          total_boxes_opened?: number | null
          total_referrals?: number | null
          total_tasks_completed?: number | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_user_multiplier: {
        Args: { _profile_id: string }
        Returns: number
      }
      get_profile_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      badge_category: "streak" | "achievement" | "wallet" | "special"
      badge_rarity: "common" | "rare" | "epic" | "legendary" | "mythic"
      box_rarity: "common" | "rare" | "legendary"
      task_status: "active" | "inactive" | "expired"
      task_type: "daily" | "social" | "referral" | "wallet" | "onetime"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      badge_category: ["streak", "achievement", "wallet", "special"],
      badge_rarity: ["common", "rare", "epic", "legendary", "mythic"],
      box_rarity: ["common", "rare", "legendary"],
      task_status: ["active", "inactive", "expired"],
      task_type: ["daily", "social", "referral", "wallet", "onetime"],
    },
  },
} as const
