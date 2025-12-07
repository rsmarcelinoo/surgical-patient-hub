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
      attachments: {
        Row: {
          attachment_type: string
          description: string | null
          episode_id: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          mime_type: string | null
          patient_id: string
          surgery_id: string | null
          uploaded_at: string
        }
        Insert: {
          attachment_type?: string
          description?: string | null
          episode_id?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          mime_type?: string | null
          patient_id: string
          surgery_id?: string | null
          uploaded_at?: string
        }
        Update: {
          attachment_type?: string
          description?: string | null
          episode_id?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          mime_type?: string | null
          patient_id?: string
          surgery_id?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author: string | null
          created_at: string
          episode_id: string | null
          id: string
          is_pinned: boolean
          mentions: string[] | null
          patient_id: string | null
          surgery_id: string | null
          text: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          episode_id?: string | null
          id?: string
          is_pinned?: boolean
          mentions?: string[] | null
          patient_id?: string | null
          surgery_id?: string | null
          text: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          episode_id?: string | null
          id?: string
          is_pinned?: boolean
          mentions?: string[] | null
          patient_id?: string | null
          surgery_id?: string | null
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          consultation_date: string
          consultation_type: string
          created_at: string
          diagnosis: string | null
          episode_id: string | null
          follow_up_date: string | null
          id: string
          location: string | null
          notes: string | null
          patient_id: string
          surgery_id: string | null
          treatment_plan: string | null
          type: string
          updated_at: string
        }
        Insert: {
          consultation_date?: string
          consultation_type?: string
          created_at?: string
          diagnosis?: string | null
          episode_id?: string | null
          follow_up_date?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          patient_id: string
          surgery_id?: string | null
          treatment_plan?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          consultation_date?: string
          consultation_type?: string
          created_at?: string
          diagnosis?: string | null
          episode_id?: string | null
          follow_up_date?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          patient_id?: string
          surgery_id?: string | null
          treatment_plan?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          end_date_new: string | null
          episode_type: string
          hospital_id: string | null
          id: string
          patient_id: string
          start_date: string
          start_date_new: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_date_new?: string | null
          episode_type?: string
          hospital_id?: string | null
          id?: string
          patient_id: string
          start_date?: string
          start_date_new?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_date_new?: string | null
          episode_type?: string
          hospital_id?: string | null
          id?: string
          patient_id?: string
          start_date?: string
          start_date_new?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episodes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      kanban_boards: {
        Row: {
          columns_config: Json
          created_at: string
          description: string | null
          hospital: string | null
          hospital_id: string | null
          id: string
          name: string
          service: string | null
          updated_at: string
        }
        Insert: {
          columns_config?: Json
          created_at?: string
          description?: string | null
          hospital?: string | null
          hospital_id?: string | null
          id?: string
          name: string
          service?: string | null
          updated_at?: string
        }
        Update: {
          columns_config?: Json
          created_at?: string
          description?: string | null
          hospital?: string | null
          hospital_id?: string | null
          id?: string
          name?: string
          service?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_boards_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_cards: {
        Row: {
          board_id: string
          column_name: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          position: number
          priority: string | null
          scheduled_date: string | null
          surgery_type: string | null
          updated_at: string
        }
        Insert: {
          board_id: string
          column_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          position?: number
          priority?: string | null
          scheduled_date?: string | null
          surgery_type?: string | null
          updated_at?: string
        }
        Update: {
          board_id?: string
          column_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          position?: number
          priority?: string | null
          scheduled_date?: string | null
          surgery_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_cards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          date_of_birth: string | null
          gender: string | null
          id: string
          medical_record_number: string | null
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          medical_record_number?: string | null
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          medical_record_number?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      surgeries: {
        Row: {
          assistants: string[] | null
          created_at: string
          drawings: string[] | null
          duration_minutes: number | null
          episode_id: string | null
          extra_fields: Json | null
          hospital_id: string | null
          id: string
          main_surgeon: string | null
          notes: string | null
          operating_room: string | null
          patient_id: string
          procedure_name: string
          scheduled_date: string | null
          status: string
          structured_description: string | null
          surgeon: string | null
          updated_at: string
        }
        Insert: {
          assistants?: string[] | null
          created_at?: string
          drawings?: string[] | null
          duration_minutes?: number | null
          episode_id?: string | null
          extra_fields?: Json | null
          hospital_id?: string | null
          id?: string
          main_surgeon?: string | null
          notes?: string | null
          operating_room?: string | null
          patient_id: string
          procedure_name: string
          scheduled_date?: string | null
          status?: string
          structured_description?: string | null
          surgeon?: string | null
          updated_at?: string
        }
        Update: {
          assistants?: string[] | null
          created_at?: string
          drawings?: string[] | null
          duration_minutes?: number | null
          episode_id?: string | null
          extra_fields?: Json | null
          hospital_id?: string | null
          id?: string
          main_surgeon?: string | null
          notes?: string | null
          operating_room?: string | null
          patient_id?: string
          procedure_name?: string
          scheduled_date?: string | null
          status?: string
          structured_description?: string | null
          surgeon?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surgeries_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
