export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      checkout_customization: {
        Row: {
          accent_color: string | null
          animation_enabled: boolean | null
          background_color: string
          background_image_url: string | null
          border_color: string | null
          border_radius: string | null
          button_size: string | null
          button_style: string | null
          card_background_color: string | null
          checkout_description: string | null
          checkout_title: string
          company_name: string
          created_at: string
          custom_css: string | null
          enable_boleto: boolean
          enable_credit_card: boolean
          enable_debit_card: boolean
          enable_order_bump: boolean
          enable_pix: boolean
          font_family: string | null
          gradient_enabled: boolean | null
          gradient_end_color: string | null
          gradient_start_color: string | null
          header_background_color: string | null
          hover_color: string | null
          id: string
          layout_style: string | null
          logo_url: string | null
          order_bump_description: string | null
          order_bump_image_url: string | null
          order_bump_price: number | null
          order_bump_title: string | null
          primary_color: string
          secondary_color: string
          shadow_enabled: boolean | null
          show_company_logo: boolean
          show_payment_methods: boolean
          show_security_badges: boolean
          spacing_size: string | null
          subtitle_color: string | null
          success_message: string
          text_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          animation_enabled?: boolean | null
          background_color?: string
          background_image_url?: string | null
          border_color?: string | null
          border_radius?: string | null
          button_size?: string | null
          button_style?: string | null
          card_background_color?: string | null
          checkout_description?: string | null
          checkout_title?: string
          company_name?: string
          created_at?: string
          custom_css?: string | null
          enable_boleto?: boolean
          enable_credit_card?: boolean
          enable_debit_card?: boolean
          enable_order_bump?: boolean
          enable_pix?: boolean
          font_family?: string | null
          gradient_enabled?: boolean | null
          gradient_end_color?: string | null
          gradient_start_color?: string | null
          header_background_color?: string | null
          hover_color?: string | null
          id?: string
          layout_style?: string | null
          logo_url?: string | null
          order_bump_description?: string | null
          order_bump_image_url?: string | null
          order_bump_price?: number | null
          order_bump_title?: string | null
          primary_color?: string
          secondary_color?: string
          shadow_enabled?: boolean | null
          show_company_logo?: boolean
          show_payment_methods?: boolean
          show_security_badges?: boolean
          spacing_size?: string | null
          subtitle_color?: string | null
          success_message?: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          animation_enabled?: boolean | null
          background_color?: string
          background_image_url?: string | null
          border_color?: string | null
          border_radius?: string | null
          button_size?: string | null
          button_style?: string | null
          card_background_color?: string | null
          checkout_description?: string | null
          checkout_title?: string
          company_name?: string
          created_at?: string
          custom_css?: string | null
          enable_boleto?: boolean
          enable_credit_card?: boolean
          enable_debit_card?: boolean
          enable_order_bump?: boolean
          enable_pix?: boolean
          font_family?: string | null
          gradient_enabled?: boolean | null
          gradient_end_color?: string | null
          gradient_start_color?: string | null
          header_background_color?: string | null
          hover_color?: string | null
          id?: string
          layout_style?: string | null
          logo_url?: string | null
          order_bump_description?: string | null
          order_bump_image_url?: string | null
          order_bump_price?: number | null
          order_bump_title?: string | null
          primary_color?: string
          secondary_color?: string
          shadow_enabled?: boolean | null
          show_company_logo?: boolean
          show_payment_methods?: boolean
          show_security_badges?: boolean
          spacing_size?: string | null
          subtitle_color?: string | null
          success_message?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      checkout_links: {
        Row: {
          amount: number
          checkout_url: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          mercadopago_preference_id: string | null
          reference_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          mercadopago_preference_id?: string | null
          reference_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          mercadopago_preference_id?: string | null
          reference_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mercadopago_config: {
        Row: {
          access_token: string
          created_at: string
          id: string
          is_sandbox: boolean
          public_key: string | null
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          is_sandbox?: boolean
          public_key?: string | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          is_sandbox?: boolean
          public_key?: string | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          payment_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          payment_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          payment_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      order_bumps: {
        Row: {
          checkout_link_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          checkout_link_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price: number
          title: string
          updated_at?: string
        }
        Update: {
          checkout_link_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_bumps_checkout_link_id_fkey"
            columns: ["checkout_link_id"]
            isOneToOne: false
            referencedRelation: "checkout_links"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          checkout_link_id: string | null
          created_at: string
          currency: string
          customer_data: Json | null
          fee_amount: number | null
          id: string
          mercadopago_payment_id: string
          net_received_amount: number | null
          order_bump_amount: number | null
          order_bump_selected: boolean | null
          payer_document_number: string | null
          payer_document_type: string | null
          payer_email: string | null
          payer_name: string | null
          payer_phone: string | null
          payment_method: string | null
          status: string
          transaction_amount: number | null
          updated_at: string
          webhook_data: Json | null
        }
        Insert: {
          amount: number
          checkout_link_id?: string | null
          created_at?: string
          currency: string
          customer_data?: Json | null
          fee_amount?: number | null
          id?: string
          mercadopago_payment_id: string
          net_received_amount?: number | null
          order_bump_amount?: number | null
          order_bump_selected?: boolean | null
          payer_document_number?: string | null
          payer_document_type?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_method?: string | null
          status: string
          transaction_amount?: number | null
          updated_at?: string
          webhook_data?: Json | null
        }
        Update: {
          amount?: number
          checkout_link_id?: string | null
          created_at?: string
          currency?: string
          customer_data?: Json | null
          fee_amount?: number | null
          id?: string
          mercadopago_payment_id?: string
          net_received_amount?: number | null
          order_bump_amount?: number | null
          order_bump_selected?: boolean | null
          payer_document_number?: string | null
          payer_document_type?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_method?: string | null
          status?: string
          transaction_amount?: number | null
          updated_at?: string
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_checkout_link_id_fkey"
            columns: ["checkout_link_id"]
            isOneToOne: false
            referencedRelation: "checkout_links"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_checkout_link: {
        Args: { link_id: string }
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
