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
      athlete_profiles: {
        Row: {
          created_at: string
          goals: string | null
          height_cm: number | null
          id: string
          sports: string[]
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          goals?: string | null
          height_cm?: number | null
          id: string
          sports?: string[]
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          goals?: string | null
          height_cm?: number | null
          id?: string
          sports?: string[]
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          coach_id: string
          created_at: string
          date: string
          end_time: string
          id: string
          start_time: string
          status: Database["public"]["Enums"]["slot_status"]
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          start_time: string
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          id: string
          note: string | null
          price: number | null
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          id?: string
          note?: string | null
          price?: number | null
          slot_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          note?: string | null
          price?: number | null
          slot_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_events: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
          payload: Json
          type: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
          payload?: Json
          type: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          payload?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_events_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_goals: {
        Row: {
          created_at: string
          goal: string
          id: string
          relationship_id: string
          status: string
          target_date: string | null
        }
        Insert: {
          created_at?: string
          goal: string
          id?: string
          relationship_id: string
          status?: string
          target_date?: string | null
        }
        Update: {
          created_at?: string
          goal?: string
          id?: string
          relationship_id?: string
          status?: string
          target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_goals_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          relationship_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          relationship_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          relationship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      club_profiles: {
        Row: {
          about: string | null
          application_status: string
          city: string | null
          created_at: string
          hours: string | null
          id: string
          name: string
          programs: Json
          reviewed_at: string | null
          reviewed_by: string | null
          sport: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          about?: string | null
          application_status?: string
          city?: string | null
          created_at?: string
          hours?: string | null
          id: string
          name?: string
          programs?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          sport?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          about?: string | null
          application_status?: string
          city?: string | null
          created_at?: string
          hours?: string | null
          id?: string
          name?: string
          programs?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          sport?: string | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "club_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_profiles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_resources: {
        Row: {
          active: boolean
          capacity: number | null
          close_time: string
          created_at: string | null
          id: string
          kind: string
          name: string
          open_time: string
          owner_id: string
          sort_order: number
          sport: string | null
        }
        Insert: {
          active?: boolean
          capacity?: number | null
          close_time?: string
          created_at?: string | null
          id?: string
          kind: string
          name: string
          open_time?: string
          owner_id: string
          sort_order?: number
          sport?: string | null
        }
        Update: {
          active?: boolean
          capacity?: number | null
          close_time?: string
          created_at?: string | null
          id?: string
          kind?: string
          name?: string
          open_time?: string
          owner_id?: string
          sort_order?: number
          sport?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_resources_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_clients: {
        Row: {
          athlete_id: string | null
          coach_id: string
          created_at: string
          display_name: string
          email: string | null
          goal: string | null
          id: string
          phone: string | null
          source: string | null
          stage: string
          stage_position: number
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          coach_id: string
          created_at?: string
          display_name?: string
          email?: string | null
          goal?: string | null
          id?: string
          phone?: string | null
          source?: string | null
          stage?: string
          stage_position?: number
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          coach_id?: string
          created_at?: string
          display_name?: string
          email?: string | null
          goal?: string | null
          id?: string
          phone?: string | null
          source?: string | null
          stage?: string
          stage_position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_clients_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_clients_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_events: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          location: string | null
          title: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_events_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          application_status: string
          bio: string | null
          certifications: string[]
          created_at: string
          discount_pct: number
          gallery: string[]
          id: string
          level: string | null
          price_per_group_session: number | null
          price_per_session: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_links: Json
          specialisms: string[]
          sport: string | null
          updated_at: string
          verified: boolean
          years_experience: number | null
        }
        Insert: {
          application_status?: string
          bio?: string | null
          certifications?: string[]
          created_at?: string
          discount_pct?: number
          gallery?: string[]
          id: string
          level?: string | null
          price_per_group_session?: number | null
          price_per_session?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: Json
          specialisms?: string[]
          sport?: string | null
          updated_at?: string
          verified?: boolean
          years_experience?: number | null
        }
        Update: {
          application_status?: string
          bio?: string | null
          certifications?: string[]
          created_at?: string
          discount_pct?: number
          gallery?: string[]
          id?: string
          level?: string | null
          price_per_group_session?: number | null
          price_per_session?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: Json
          specialisms?: string[]
          sport?: string | null
          updated_at?: string
          verified?: boolean
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_profiles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_sessions: {
        Row: {
          booking_id: string | null
          capacity: number | null
          client_id: string | null
          coach_id: string
          created_at: string
          ends_at: string
          id: string
          is_public: boolean
          kind: string
          led_by: string | null
          location: string | null
          note: string | null
          resource_id: string | null
          series_id: string | null
          sport: string | null
          starts_at: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          capacity?: number | null
          client_id?: string | null
          coach_id: string
          created_at?: string
          ends_at: string
          id?: string
          is_public?: boolean
          kind?: string
          led_by?: string | null
          location?: string | null
          note?: string | null
          resource_id?: string | null
          series_id?: string | null
          sport?: string | null
          starts_at: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          capacity?: number | null
          client_id?: string | null
          coach_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          is_public?: boolean
          kind?: string
          led_by?: string | null
          location?: string | null
          note?: string | null
          resource_id?: string | null
          series_id?: string | null
          sport?: string | null
          starts_at?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_sessions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "club_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_sessions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "session_series"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_tasks: {
        Row: {
          client_id: string | null
          coach_id: string
          created_at: string
          done: boolean
          done_at: string | null
          due_date: string | null
          id: string
          title: string
        }
        Insert: {
          client_id?: string | null
          coach_id: string
          created_at?: string
          done?: boolean
          done_at?: string | null
          due_date?: string | null
          id?: string
          title: string
        }
        Update: {
          client_id?: string | null
          coach_id?: string
          created_at?: string
          done?: boolean
          done_at?: string | null
          due_date?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_tasks_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          id: string
          last_message_at: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          viewer_id: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          viewer_id?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          is_admin: boolean
          language: string
          role: Database["public"]["Enums"]["app_role"]
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_admin?: boolean
          language?: string
          role: Database["public"]["Enums"]["app_role"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
          language?: string
          role?: Database["public"]["Enums"]["app_role"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_tasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          id: string
          program_id: string
          task_date: string
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          program_id: string
          task_date: string
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          program_id?: string
          task_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_tasks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      series_members: {
        Row: {
          client_id: string
          series_id: string
        }
        Insert: {
          client_id: string
          series_id: string
        }
        Update: {
          client_id?: string
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_members_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "session_series"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendees: {
        Row: {
          client_id: string
          created_at: string
          id: string
          session_id: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          session_id: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendees_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendees_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coach_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_series: {
        Row: {
          capacity: number | null
          client_id: string | null
          coach_id: string
          created_at: string
          duration_min: number
          ends_on: string | null
          id: string
          is_public: boolean
          kind: string
          led_by: string | null
          location: string | null
          resource_id: string | null
          sport: string | null
          start_time: string
          starts_on: string
          title: string | null
          weekday: number
        }
        Insert: {
          capacity?: number | null
          client_id?: string | null
          coach_id: string
          created_at?: string
          duration_min?: number
          ends_on?: string | null
          id?: string
          is_public?: boolean
          kind?: string
          led_by?: string | null
          location?: string | null
          resource_id?: string | null
          sport?: string | null
          start_time: string
          starts_on: string
          title?: string | null
          weekday: number
        }
        Update: {
          capacity?: number | null
          client_id?: string | null
          coach_id?: string
          created_at?: string
          duration_min?: number
          ends_on?: string | null
          id?: string
          is_public?: boolean
          kind?: string
          led_by?: string | null
          location?: string | null
          resource_id?: string | null
          sport?: string | null
          start_time?: string
          starts_on?: string
          title?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_series_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_series_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_series_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "club_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          relationship_id: string
          sent_at: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          relationship_id: string
          sent_at?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          relationship_id?: string
          sent_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_confirm_email: { Args: { _user_id: string }; Returns: undefined }
      admin_list_users: {
        Args: never
        Returns: {
          application_status: string
          city: string
          created_at: string
          email: string
          email_confirmed: boolean
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      book_group_session: { Args: { payload: Json }; Returns: string }
      coach_has_athlete: {
        Args: { _athlete: string; _coach: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      public_session_spots: { Args: { session_id: string }; Returns: number }
    }
    Enums: {
      app_role: "athlete" | "coach" | "club"
      booking_status: "pending" | "confirmed" | "declined" | "cancelled"
      slot_status: "open" | "pending" | "booked"
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
    Enums: {
      app_role: ["athlete", "coach", "club"],
      booking_status: ["pending", "confirmed", "declined", "cancelled"],
      slot_status: ["open", "pending", "booked"],
    },
  },
} as const
