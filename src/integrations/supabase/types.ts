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
      adapters: {
        Row: {
          config: Json
          created_at: string
          id: string
          kind: string
          mode: Database["public"]["Enums"]["workspace_mode"]
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          kind: string
          mode?: Database["public"]["Enums"]["workspace_mode"]
          provider: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          kind?: string
          mode?: Database["public"]["Enums"]["workspace_mode"]
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message_id: string
          parts: Json
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          parts: Json
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          parts?: Json
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      decision_cards: {
        Row: {
          amount: number | null
          created_at: string
          decided_at: string | null
          detail: string | null
          id: string
          requestor: string
          risk: Database["public"]["Enums"]["decision_risk"]
          sip_report: Json | null
          specialist_id: string | null
          specialist_name: string
          status: Database["public"]["Enums"]["decision_status"]
          task_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          decided_at?: string | null
          detail?: string | null
          id?: string
          requestor: string
          risk: Database["public"]["Enums"]["decision_risk"]
          sip_report?: Json | null
          specialist_id?: string | null
          specialist_name: string
          status?: Database["public"]["Enums"]["decision_status"]
          task_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          decided_at?: string | null
          detail?: string | null
          id?: string
          requestor?: string
          risk?: Database["public"]["Enums"]["decision_risk"]
          sip_report?: Json | null
          specialist_id?: string | null
          specialist_name?: string
          status?: Database["public"]["Enums"]["decision_status"]
          task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_cards_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_twins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_cards_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_agent_actions: {
        Row: {
          agent_label: string
          args: Json | null
          created_at: string
          id: string
          result: Json | null
          tool: string
        }
        Insert: {
          agent_label: string
          args?: Json | null
          created_at?: string
          id?: string
          result?: Json | null
          tool: string
        }
        Update: {
          agent_label?: string
          args?: Json | null
          created_at?: string
          id?: string
          result?: Json | null
          tool?: string
        }
        Relationships: []
      }
      demo_api_keys: {
        Row: {
          agent_label: string
          created_at: string
          id: string
          key_hash: string
        }
        Insert: {
          agent_label: string
          created_at?: string
          id?: string
          key_hash: string
        }
        Update: {
          agent_label?: string
          created_at?: string
          id?: string
          key_hash?: string
        }
        Relationships: []
      }
      demo_customers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      demo_orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string
          id: string
          order_number: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email: string
          id?: string
          order_number: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string
          id?: string
          order_number?: string
          status?: string
        }
        Relationships: []
      }
      demo_refunds: {
        Row: {
          amount: number
          created_at: string
          governance_status: string
          id: string
          issued_by_agent: string
          order_number: string
          reason: string | null
          sip_receipt_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          governance_status?: string
          id?: string
          issued_by_agent: string
          order_number: string
          reason?: string | null
          sip_receipt_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          governance_status?: string
          id?: string
          issued_by_agent?: string
          order_number?: string
          reason?: string | null
          sip_receipt_id?: string | null
        }
        Relationships: []
      }
      ledger_preview: {
        Row: {
          access_bond: number
          burn_24h: number
          earning_pool: number
          staked: number
          updated_at: string
          user_id: string
        }
        Insert: {
          access_bond?: number
          burn_24h?: number
          earning_pool?: number
          staked?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          access_bond?: number
          burn_24h?: number
          earning_pool?: number
          staked?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      master_twins: {
        Row: {
          created_at: string
          expertise: string | null
          id: string
          initials: string
          mode: Database["public"]["Enums"]["workspace_mode"]
          name: string
          reputation: number
          status: Database["public"]["Enums"]["twin_status"]
          updated_at: string
          user_id: string
          verified_actions: number
        }
        Insert: {
          created_at?: string
          expertise?: string | null
          id?: string
          initials?: string
          mode?: Database["public"]["Enums"]["workspace_mode"]
          name: string
          reputation?: number
          status?: Database["public"]["Enums"]["twin_status"]
          updated_at?: string
          user_id: string
          verified_actions?: number
        }
        Update: {
          created_at?: string
          expertise?: string | null
          id?: string
          initials?: string
          mode?: Database["public"]["Enums"]["workspace_mode"]
          name?: string
          reputation?: number
          status?: Database["public"]["Enums"]["twin_status"]
          updated_at?: string
          user_id?: string
          verified_actions?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          action: string
          agent_id: number | null
          anchor_attempts: number
          anchor_last_attempt_at: string | null
          anchor_last_error: string | null
          anchor_status: Database["public"]["Enums"]["anchor_status"]
          block_number: number | null
          chain_id: number
          created_at: string
          decision_card_id: string | null
          feedback_tx_hash: string | null
          id: string
          identity_tx_hash: string | null
          iso_badge: boolean
          payload: Json | null
          payload_hash: string
          sip_id: string
          specialist_id: string | null
          task_id: string | null
          tx_hash: string | null
          user_id: string
          validation_response: number | null
          validation_tx_hash: string | null
        }
        Insert: {
          action: string
          agent_id?: number | null
          anchor_attempts?: number
          anchor_last_attempt_at?: string | null
          anchor_last_error?: string | null
          anchor_status?: Database["public"]["Enums"]["anchor_status"]
          block_number?: number | null
          chain_id?: number
          created_at?: string
          decision_card_id?: string | null
          feedback_tx_hash?: string | null
          id?: string
          identity_tx_hash?: string | null
          iso_badge?: boolean
          payload?: Json | null
          payload_hash: string
          sip_id: string
          specialist_id?: string | null
          task_id?: string | null
          tx_hash?: string | null
          user_id: string
          validation_response?: number | null
          validation_tx_hash?: string | null
        }
        Update: {
          action?: string
          agent_id?: number | null
          anchor_attempts?: number
          anchor_last_attempt_at?: string | null
          anchor_last_error?: string | null
          anchor_status?: Database["public"]["Enums"]["anchor_status"]
          block_number?: number | null
          chain_id?: number
          created_at?: string
          decision_card_id?: string | null
          feedback_tx_hash?: string | null
          id?: string
          identity_tx_hash?: string | null
          iso_badge?: boolean
          payload?: Json | null
          payload_hash?: string
          sip_id?: string
          specialist_id?: string | null
          task_id?: string | null
          tx_hash?: string | null
          user_id?: string
          validation_response?: number | null
          validation_tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_decision_card_id_fkey"
            columns: ["decision_card_id"]
            isOneToOne: false
            referencedRelation: "decision_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_twins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_entries: {
        Row: {
          created_at: string
          delta: number
          id: string
          reason: string | null
          receipt_id: string | null
          subject_id: string
          subject_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          reason?: string | null
          receipt_id?: string | null
          subject_id: string
          subject_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          reason?: string | null
          receipt_id?: string | null
          subject_id?: string
          subject_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reputation_entries_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_assignments: {
        Row: {
          assigned_at: string
          id: string
          skill_id: string
          specialist_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          skill_id: string
          specialist_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          skill_id?: string
          specialist_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_assignments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assignments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_twins"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_installs: {
        Row: {
          id: string
          installed_at: string
          pinned_version: number
          skill_id: string
          user_id: string
        }
        Insert: {
          id?: string
          installed_at?: string
          pinned_version?: number
          skill_id: string
          user_id: string
        }
        Update: {
          id?: string
          installed_at?: string
          pinned_version?: number
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_installs_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_versions: {
        Row: {
          adapter: string
          category: string
          changelog: string | null
          created_at: string
          created_by: string
          id: string
          intent: string | null
          name: string
          price_cents: number | null
          readme: string | null
          rules: string | null
          skill_id: string
          status: string
          version: number
          visibility: string
        }
        Insert: {
          adapter?: string
          category: string
          changelog?: string | null
          created_at?: string
          created_by: string
          id?: string
          intent?: string | null
          name: string
          price_cents?: number | null
          readme?: string | null
          rules?: string | null
          skill_id: string
          status?: string
          version: number
          visibility?: string
        }
        Update: {
          adapter?: string
          category?: string
          changelog?: string | null
          created_at?: string
          created_by?: string
          id?: string
          intent?: string | null
          name?: string
          price_cents?: number | null
          readme?: string | null
          rules?: string | null
          skill_id?: string
          status?: string
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_versions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          author: string
          author_id: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          installs: number
          is_public: boolean
          name: string
          price: number | null
          price_cents: number | null
          provider: string
          readme: string | null
          rules: Json | null
          schema: Json | null
          slug: string | null
          status: string
          tags: string[]
          updated_at: string
          version: number
          visibility: string
        }
        Insert: {
          author: string
          author_id?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          installs?: number
          is_public?: boolean
          name: string
          price?: number | null
          price_cents?: number | null
          provider: string
          readme?: string | null
          rules?: Json | null
          schema?: Json | null
          slug?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          version?: number
          visibility?: string
        }
        Update: {
          author?: string
          author_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          installs?: number
          is_public?: boolean
          name?: string
          price?: number | null
          price_cents?: number | null
          provider?: string
          readme?: string | null
          rules?: Json | null
          schema?: Json | null
          slug?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          version?: number
          visibility?: string
        }
        Relationships: []
      }
      specialist_twins: {
        Row: {
          agent_domain: string | null
          agent_id: number | null
          created_at: string
          earned: number
          id: string
          identity_tx_hash: string | null
          initials: string
          name: string
          reputation: number
          role: string
          status: Database["public"]["Enums"]["twin_status"]
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_domain?: string | null
          agent_id?: number | null
          created_at?: string
          earned?: number
          id?: string
          identity_tx_hash?: string | null
          initials: string
          name: string
          reputation?: number
          role: string
          status?: Database["public"]["Enums"]["twin_status"]
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_domain?: string | null
          agent_id?: number | null
          created_at?: string
          earned?: number
          id?: string
          identity_tx_hash?: string | null
          initials?: string
          name?: string
          reputation?: number
          role?: string
          status?: Database["public"]["Enums"]["twin_status"]
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_events: {
        Row: {
          chip: string | null
          created_at: string
          detail: string | null
          id: string
          kind: string
          phase: string
          seq: number
          tag: string | null
          task_id: string
          title: string
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          chip?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          kind: string
          phase: string
          seq: number
          tag?: string | null
          task_id: string
          title: string
          tx_hash?: string | null
          user_id: string
        }
        Update: {
          chip?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          phase?: string
          seq?: number
          tag?: string | null
          task_id?: string
          title?: string
          tx_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender: string
          source: string
          task_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender: string
          source?: string
          task_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender?: string
          source?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_outcomes: {
        Row: {
          artifact: Json
          created_at: string
          id: string
          next_actions: Json
          summary: string
          task_id: string
          title: string
          user_id: string
        }
        Insert: {
          artifact?: Json
          created_at?: string
          id?: string
          next_actions?: Json
          summary: string
          task_id: string
          title: string
          user_id: string
        }
        Update: {
          artifact?: Json
          created_at?: string
          id?: string
          next_actions?: Json
          summary?: string
          task_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_outcomes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          id: string
          intent: string
          intent_json: Json | null
          skill_id: string | null
          specialist_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          intent: string
          intent_json?: Json | null
          skill_id?: string | null
          specialist_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          intent?: string
          intent_json?: Json | null
          skill_id?: string | null
          specialist_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_twins"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_links: {
        Row: {
          chat_id: number | null
          created_at: string
          id: string
          link_code: string | null
          linked_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          chat_id?: number | null
          created_at?: string
          id?: string
          link_code?: string | null
          linked_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          chat_id?: number | null
          created_at?: string
          id?: string
          link_code?: string | null
          linked_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      anchor_status: "pending" | "anchored" | "failed" | "simulated"
      app_role: "admin" | "user"
      decision_risk: "high" | "medium" | "low"
      decision_status: "pending" | "approved" | "rejected"
      task_status:
        | "pending"
        | "running"
        | "done"
        | "rejected"
        | "executing"
        | "awaiting_input"
      twin_status: "active" | "paused" | "retired"
      workspace_mode: "test" | "live"
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
      anchor_status: ["pending", "anchored", "failed", "simulated"],
      app_role: ["admin", "user"],
      decision_risk: ["high", "medium", "low"],
      decision_status: ["pending", "approved", "rejected"],
      task_status: [
        "pending",
        "running",
        "done",
        "rejected",
        "executing",
        "awaiting_input",
      ],
      twin_status: ["active", "paused", "retired"],
      workspace_mode: ["test", "live"],
    },
  },
} as const
