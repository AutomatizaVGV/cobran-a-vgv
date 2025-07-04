export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      acoes_cobranca: {
        Row: {
          cobranca_id: string
          data_acao: string
          id: string
          observacao: string | null
          resultado: string | null
          tipo_acao: string
          user_id: string
        }
        Insert: {
          cobranca_id: string
          data_acao?: string
          id?: string
          observacao?: string | null
          resultado?: string | null
          tipo_acao: string
          user_id: string
        }
        Update: {
          cobranca_id?: string
          data_acao?: string
          id?: string
          observacao?: string | null
          resultado?: string | null
          tipo_acao?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acoes_cobranca_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "cobrancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_cobranca_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cobrancas: {
        Row: {
          assistente_responsavel: string | null
          cliente_nome: string
          cpf_cnpj: string
          created_at: string
          data_cobranca: string | null
          empreendimento: string | null
          id: string
          juros_recebidos: number | null
          observacao: string | null
          origem: string | null
          produto: string
          proxima_acao: string | null
          quantidade_parcelas: number | null
          resultado_ultima_acao: string | null
          status_cliente: string | null
          status_pagamento: string
          tipo_cobranca: string | null
          ultima_acao: string | null
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          assistente_responsavel?: string | null
          cliente_nome: string
          cpf_cnpj: string
          created_at?: string
          data_cobranca?: string | null
          empreendimento?: string | null
          id?: string
          juros_recebidos?: number | null
          observacao?: string | null
          origem?: string | null
          produto: string
          proxima_acao?: string | null
          quantidade_parcelas?: number | null
          resultado_ultima_acao?: string | null
          status_cliente?: string | null
          status_pagamento?: string
          tipo_cobranca?: string | null
          ultima_acao?: string | null
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          assistente_responsavel?: string | null
          cliente_nome?: string
          cpf_cnpj?: string
          created_at?: string
          data_cobranca?: string | null
          empreendimento?: string | null
          id?: string
          juros_recebidos?: number | null
          observacao?: string | null
          origem?: string | null
          produto?: string
          proxima_acao?: string | null
          quantidade_parcelas?: number | null
          resultado_ultima_acao?: string | null
          status_cliente?: string | null
          status_pagamento?: string
          tipo_cobranca?: string | null
          ultima_acao?: string | null
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_assistente_responsavel_fkey"
            columns: ["assistente_responsavel"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_cadencia: {
        Row: {
          ativa: boolean
          conteudo: string
          created_at: string
          id: string
          ordem: number
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativa?: boolean
          conteudo: string
          created_at?: string
          id?: string
          ordem?: number
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativa?: boolean
          conteudo?: string
          created_at?: string
          id?: string
          ordem?: number
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_cadencia_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_diarias: {
        Row: {
          contatos_realizados: number
          created_at: string
          data_referencia: string
          id: string
          meta_contatos: number
          observacoes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contatos_realizados?: number
          created_at?: string
          data_referencia: string
          id?: string
          meta_contatos?: number
          observacoes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contatos_realizados?: number
          created_at?: string
          data_referencia?: string
          id?: string
          meta_contatos?: number
          observacoes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metricas_diarias_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimentos: {
        Row: {
          cobranca_id: string
          created_at: string
          data_recebimento: string
          forma_pagamento: string
          id: string
          juros_pagos: number | null
          tipo_pagamento: string | null
          valor_pago: number
        }
        Insert: {
          cobranca_id: string
          created_at?: string
          data_recebimento: string
          forma_pagamento: string
          id?: string
          juros_pagos?: number | null
          tipo_pagamento?: string | null
          valor_pago: number
        }
        Update: {
          cobranca_id?: string
          created_at?: string
          data_recebimento?: string
          forma_pagamento?: string
          id?: string
          juros_pagos?: number | null
          tipo_pagamento?: string | null
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "cobrancas"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          id: string
          password: string
          role: string
        }
        Insert: {
          email: string
          id?: string
          password: string
          role: string
        }
        Update: {
          email?: string
          id?: string
          password?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_dias_atraso: {
        Args: { vencimento_data: string }
        Returns: number
      }
      is_admin: {
        Args: { user_id: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
