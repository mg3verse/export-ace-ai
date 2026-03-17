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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_alerts: {
        Row: {
          alert_type: string
          assigned_to: string | null
          conversation_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          notified_email: boolean | null
          notified_whatsapp: boolean | null
          order_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          notified_email?: boolean | null
          notified_whatsapp?: boolean | null
          order_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          notified_email?: boolean | null
          notified_whatsapp?: boolean | null
          order_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_alerts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          timestamp: string
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          timestamp?: string
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          timestamp?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      conversations: {
        Row: {
          conversation_state: string | null
          created_at: string
          current_agent: string | null
          id: string
          lead_score: number | null
          messages: Json | null
          phone_number: string | null
          session_id: string | null
          updated_at: string
        }
        Insert: {
          conversation_state?: string | null
          created_at?: string
          current_agent?: string | null
          id?: string
          lead_score?: number | null
          messages?: Json | null
          phone_number?: string | null
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          conversation_state?: string | null
          created_at?: string
          current_agent?: string | null
          id?: string
          lead_score?: number | null
          messages?: Json | null
          phone_number?: string | null
          session_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company_name: string
          contact_person: string | null
          conversation_id: string | null
          created_at: string
          email: string | null
          id: string
          lead_score: number | null
          phone: string | null
          qualification_data: Json | null
          status: string
        }
        Insert: {
          company_name: string
          contact_person?: string | null
          conversation_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_score?: number | null
          phone?: string | null
          qualification_data?: Json | null
          status?: string
        }
        Update: {
          company_name?: string
          contact_person?: string | null
          conversation_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_score?: number | null
          phone?: string | null
          qualification_data?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          conversation_id: string | null
          created_at: string
          customer_name: string
          delivery_address: string | null
          id: string
          products: Json | null
          status: string
          total_amount: number
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          customer_name: string
          delivery_address?: string | null
          id?: string
          products?: Json | null
          status?: string
          total_amount?: number
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          customer_name?: string
          delivery_address?: string | null
          id?: string
          products?: Json | null
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          price_usd: number
          sku: string
          specifications: Json | null
          stock_quantity: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_usd: number
          sku: string
          specifications?: Json | null
          stock_quantity?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price_usd?: number
          sku?: string
          specifications?: Json | null
          stock_quantity?: number
        }
        Relationships: []
      }
      purchases: {
        Row: {
          batch: string | null
          bill_amount: number
          bill_discount: number | null
          company: string | null
          cost_per_strip: number | null
          created_at: string
          entry_no: string | null
          exp_date: string | null
          gst_pct: number | null
          id: string
          invoice_number: string
          mfg_date: string | null
          product_name: string
          purchase_date: string
          qty: number
          rate_per_strip: number
          salt_name: string | null
          supplier_name: string
          total_amount: number
        }
        Insert: {
          batch?: string | null
          bill_amount?: number
          bill_discount?: number | null
          company?: string | null
          cost_per_strip?: number | null
          created_at?: string
          entry_no?: string | null
          exp_date?: string | null
          gst_pct?: number | null
          id?: string
          invoice_number: string
          mfg_date?: string | null
          product_name: string
          purchase_date: string
          qty?: number
          rate_per_strip?: number
          salt_name?: string | null
          supplier_name: string
          total_amount?: number
        }
        Update: {
          batch?: string | null
          bill_amount?: number
          bill_discount?: number | null
          company?: string | null
          cost_per_strip?: number | null
          created_at?: string
          entry_no?: string | null
          exp_date?: string | null
          gst_pct?: number | null
          id?: string
          invoice_number?: string
          mfg_date?: string | null
          product_name?: string
          purchase_date?: string
          qty?: number
          rate_per_strip?: number
          salt_name?: string | null
          supplier_name?: string
          total_amount?: number
        }
        Relationships: []
      }
      sales: {
        Row: {
          batch: string | null
          bill_amount: number
          company: string | null
          cost: number | null
          cost_amount: number | null
          created_at: string
          customer_name: string
          exp_date: string | null
          id: string
          invoice_number: string
          mfg_date: string | null
          product_name: string
          qty: number
          sale_date: string
          salt_name: string | null
          selling_price: number
          total_selling_amount: number
        }
        Insert: {
          batch?: string | null
          bill_amount?: number
          company?: string | null
          cost?: number | null
          cost_amount?: number | null
          created_at?: string
          customer_name: string
          exp_date?: string | null
          id?: string
          invoice_number: string
          mfg_date?: string | null
          product_name: string
          qty?: number
          sale_date: string
          salt_name?: string | null
          selling_price?: number
          total_selling_amount?: number
        }
        Update: {
          batch?: string | null
          bill_amount?: number
          company?: string | null
          cost?: number | null
          cost_amount?: number | null
          created_at?: string
          customer_name?: string
          exp_date?: string | null
          id?: string
          invoice_number?: string
          mfg_date?: string | null
          product_name?: string
          qty?: number
          sale_date?: string
          salt_name?: string | null
          selling_price?: number
          total_selling_amount?: number
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
