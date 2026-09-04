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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      annual_reports: {
        Row: {
          created_at: string
          document_media_id: string | null
          id: string
          position: number
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          document_media_id?: string | null
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          document_media_id?: string | null
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "annual_reports_document_media_id_fkey"
            columns: ["document_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      article_categories: {
        Row: {
          created_at: string
          id: string
          label: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string | null
          body: Json
          category_id: string | null
          cover_media_id: string | null
          created_at: string
          excerpt: string
          id: string
          is_placeholder: boolean
          published_at: string | null
          reading_minutes: number | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: Json
          category_id?: string | null
          cover_media_id?: string | null
          created_at?: string
          excerpt: string
          id?: string
          is_placeholder?: boolean
          published_at?: string | null
          reading_minutes?: number | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: Json
          category_id?: string | null
          cover_media_id?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          is_placeholder?: boolean
          published_at?: string | null
          reading_minutes?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "article_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_versions: {
        Row: {
          comment: string | null
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          snapshot: Json
          version_number: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      core_values: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_visible: boolean
          position: number
          title: string
          tone: Database["public"]["Enums"]["media_tone"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          is_visible?: boolean
          position?: number
          title: string
          tone?: Database["public"]["Enums"]["media_tone"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_visible?: boolean
          position?: number
          title?: string
          tone?: Database["public"]["Enums"]["media_tone"]
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          bullets: string[]
          created_at: string
          id: string
          position: number
          question: string
          status: Database["public"]["Enums"]["content_status"]
          topic: string
          updated_at: string
        }
        Insert: {
          answer: string
          bullets?: string[]
          created_at?: string
          id?: string
          position?: number
          question: string
          status?: Database["public"]["Enums"]["content_status"]
          topic: string
          updated_at?: string
        }
        Update: {
          answer?: string
          bullets?: string[]
          created_at?: string
          id?: string
          position?: number
          question?: string
          status?: Database["public"]["Enums"]["content_status"]
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          created_at: string
          form_type: string
          handled_by: string | null
          id: string
          ip: unknown
          notes: string | null
          payload: Json
          status: Database["public"]["Enums"]["submission_status"]
        }
        Insert: {
          created_at?: string
          form_type: string
          handled_by?: string | null
          id?: string
          ip?: unknown
          notes?: string | null
          payload: Json
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Update: {
          created_at?: string
          form_type?: string
          handled_by?: string | null
          id?: string
          ip?: unknown
          notes?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_categories: {
        Row: {
          created_at: string
          id: string
          label: string
          position: number
          slug: string
          tone: Database["public"]["Enums"]["media_tone"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          position?: number
          slug: string
          tone?: Database["public"]["Enums"]["media_tone"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          position?: number
          slug?: string
          tone?: Database["public"]["Enums"]["media_tone"]
          updated_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          media_id: string
          position: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          media_id: string
          position?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          media_id?: string
          position?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gallery_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string
          bucket: string
          caption: string | null
          created_at: string
          filename: string
          folder: string | null
          height: number | null
          id: string
          mime_type: string
          path: string
          size_bytes: number
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text: string
          bucket: string
          caption?: string | null
          created_at?: string
          filename: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type: string
          path: string
          size_bytes: number
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string
          bucket?: string
          caption?: string | null
          created_at?: string
          filename?: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string
          path?: string
          size_bytes?: number
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_items: {
        Row: {
          created_at: string
          description: string | null
          href: string
          id: string
          is_external: boolean
          is_visible: boolean
          label: string
          menu: string
          parent_id: string | null
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          href: string
          id?: string
          is_external?: boolean
          is_visible?: boolean
          label: string
          menu: string
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          href?: string
          id?: string
          is_external?: boolean
          is_visible?: boolean
          label?: string
          menu?: string
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      page_sections: {
        Row: {
          block_type: string
          content: Json
          created_at: string
          id: string
          is_visible: boolean
          page_id: string
          position: number
          updated_at: string
        }
        Insert: {
          block_type: string
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id: string
          position: number
          updated_at?: string
        }
        Update: {
          block_type?: string
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string
          created_by: string | null
          hero: Json | null
          id: string
          is_system: boolean
          meta_description: string | null
          meta_title: string | null
          og_media_id: string | null
          published_at: string | null
          route: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          hero?: Json | null
          id?: string
          is_system?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_media_id?: string | null
          published_at?: string | null
          route: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          hero?: Json | null
          id?: string
          is_system?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_media_id?: string | null
          published_at?: string | null
          route?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_og_media_id_fkey"
            columns: ["og_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_media_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          last_seen_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_media_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          last_seen_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_media_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_avatar_media_id_fkey"
            columns: ["avatar_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      programmes: {
        Row: {
          actions: string[]
          benevolat_label: string
          besoins: string[]
          body: Json | null
          cover_media_id: string | null
          created_at: string
          gallery_media_ids: string[]
          icon: string
          id: string
          position: number
          publics: string[]
          short_title: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string
          title: string
          tone: Database["public"]["Enums"]["media_tone"]
          updated_at: string
        }
        Insert: {
          actions?: string[]
          benevolat_label: string
          besoins?: string[]
          body?: Json | null
          cover_media_id?: string | null
          created_at?: string
          gallery_media_ids?: string[]
          icon: string
          id?: string
          position?: number
          publics?: string[]
          short_title: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary: string
          title: string
          tone?: Database["public"]["Enums"]["media_tone"]
          updated_at?: string
        }
        Update: {
          actions?: string[]
          benevolat_label?: string
          besoins?: string[]
          body?: Json | null
          cover_media_id?: string | null
          created_at?: string
          gallery_media_ids?: string[]
          icon?: string
          id?: string
          position?: number
          publics?: string[]
          short_title?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          title?: string
          tone?: Database["public"]["Enums"]["media_tone"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmes_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          group: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          group: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          group?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stats: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_visible: boolean
          key: string
          label: string
          note: string | null
          position: number
          suffix: string | null
          to_confirm: boolean
          updated_at: string
          value: number | null
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          is_visible?: boolean
          key: string
          label: string
          note?: string | null
          position?: number
          suffix?: string | null
          to_confirm?: boolean
          updated_at?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_visible?: boolean
          key?: string
          label?: string
          note?: string | null
          position?: number
          suffix?: string | null
          to_confirm?: boolean
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          name: string
          photo_media_id: string | null
          position: number
          role: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          photo_media_id?: string | null
          position?: number
          role: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_media_id?: string | null
          position?: number
          role?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_photo_media_id_fkey"
            columns: ["photo_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string
          created_at: string
          has_consent: boolean
          id: string
          photo_media_id: string | null
          position: number
          programme_id: string | null
          quote: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          author_name: string
          author_role: string
          created_at?: string
          has_consent?: boolean
          id?: string
          photo_media_id?: string | null
          position?: number
          programme_id?: string | null
          quote: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string
          created_at?: string
          has_consent?: boolean
          id?: string
          photo_media_id?: string | null
          position?: number
          programme_id?: string | null
          quote?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_photo_media_id_fkey"
            columns: ["photo_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_can_publish: { Args: never; Returns: boolean }
      app_current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      app_is_staff: { Args: never; Returns: boolean }
      consume_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      insert_section_at: {
        Args: {
          p_block_type: string
          p_content: Json
          p_is_visible: boolean
          p_page_id: string
          p_position: number
        }
        Returns: {
          block_type: string
          content: Json
          created_at: string
          id: string
          is_visible: boolean
          page_id: string
          position: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "page_sections"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reorder_rows: {
        Args: { p_ids: string[]; p_table: string }
        Returns: undefined
      }
    }
    Enums: {
      content_status: "draft" | "in_review" | "published" | "archived"
      media_tone: "navy" | "blue" | "green" | "orange" | "neutral"
      submission_status: "new" | "read" | "handled" | "archived" | "spam"
      user_role: "super_admin" | "admin" | "editor"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      content_status: ["draft", "in_review", "published", "archived"],
      media_tone: ["navy", "blue", "green", "orange", "neutral"],
      submission_status: ["new", "read", "handled", "archived", "spam"],
      user_role: ["super_admin", "admin", "editor"],
    },
  },
} as const
