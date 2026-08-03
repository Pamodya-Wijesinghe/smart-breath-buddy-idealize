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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      asthma_diary: {
        Row: {
          comments: string | null
          created_at: string | null
          date: string
          id: string
          inhaler_uses: number | null
          medication_time: string | null
          symptom_notes: string | null
          symptom_severity: number | null
          triggers: string | null
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          date: string
          id?: string
          inhaler_uses?: number | null
          medication_time?: string | null
          symptom_notes?: string | null
          symptom_severity?: number | null
          triggers?: string | null
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          date?: string
          id?: string
          inhaler_uses?: number | null
          medication_time?: string | null
          symptom_notes?: string | null
          symptom_severity?: number | null
          triggers?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asthma_diary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      breathing_sessions: {
        Row: {
          created_at: string
          date: string
          feedback_message: string | null
          holding_time: number | null
          id: string
          inhalation_duration: number | null
          inhalation_strength: number | null
          orientation_angle: number | null
          result: string
          score: number | null
          session_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          feedback_message?: string | null
          holding_time?: number | null
          id?: string
          inhalation_duration?: number | null
          inhalation_strength?: number | null
          orientation_angle?: number | null
          result: string
          score?: number | null
          session_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          feedback_message?: string | null
          holding_time?: number | null
          id?: string
          inhalation_duration?: number | null
          inhalation_strength?: number | null
          orientation_angle?: number | null
          result?: string
          score?: number | null
          session_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          battery_level: number | null
          created_at: string | null
          esp32_id: string
          firmware_version: string | null
          id: string
          is_charging: boolean | null
          last_sync: string | null
          user_id: string
        }
        Insert: {
          battery_level?: number | null
          created_at?: string | null
          esp32_id: string
          firmware_version?: string | null
          id?: string
          is_charging?: boolean | null
          last_sync?: string | null
          user_id: string
        }
        Update: {
          battery_level?: number | null
          created_at?: string | null
          esp32_id?: string
          firmware_version?: string | null
          id?: string
          is_charging?: boolean | null
          last_sync?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inhalation_logs: {
        Row: {
          created_at: string | null
          device_id: string | null
          duration: number | null
          feedback_message: string | null
          id: string
          inhalation_strength: number | null
          orientation_angle: number | null
          result: Database["public"]["Enums"]["inhalation_result"]
          timestamp: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          duration?: number | null
          feedback_message?: string | null
          id?: string
          inhalation_strength?: number | null
          orientation_angle?: number | null
          result: Database["public"]["Enums"]["inhalation_result"]
          timestamp?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          duration?: number | null
          feedback_message?: string | null
          id?: string
          inhalation_strength?: number | null
          orientation_angle?: number | null
          result?: Database["public"]["Enums"]["inhalation_result"]
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inhalation_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inhalation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          asthma_severity: Database["public"]["Enums"]["asthma_severity"] | null
          created_at: string | null
          id: string
          is_child: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          asthma_severity?:
            | Database["public"]["Enums"]["asthma_severity"]
            | null
          created_at?: string | null
          id: string
          is_child?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          asthma_severity?:
            | Database["public"]["Enums"]["asthma_severity"]
            | null
          created_at?: string | null
          id?: string
          is_child?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      asthma_severity: "mild" | "moderate" | "severe"
      inhalation_result:
        | "correct"
        | "too_fast"
        | "too_weak"
        | "wrong_angle"
        | "mistimed"
      notification_type:
        | "inhalation_alert"
        | "daily_reminder"
        | "battery_alert"
        | "device_sync"
        | "achievement"
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
      asthma_severity: ["mild", "moderate", "severe"],
      inhalation_result: [
        "correct",
        "too_fast",
        "too_weak",
        "wrong_angle",
        "mistimed",
      ],
      notification_type: [
        "inhalation_alert",
        "daily_reminder",
        "battery_alert",
        "device_sync",
        "achievement",
      ],
    },
  },
} as const
