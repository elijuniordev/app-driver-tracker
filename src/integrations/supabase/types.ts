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
      car_configs: {
        Row: {
          aluguel_semanal: number
          consumo_km_l: number
          created_at: string
          data_inicio_contrato: string
          duracao_contrato_dias: number
          id: string
          limite_km_semanal: number
          modelo: string
          preco_combustivel: number
          updated_at: string
          user_id: string
          valor_km_excedido: number
        }
        Insert: {
          aluguel_semanal?: number
          consumo_km_l?: number
          created_at?: string
          data_inicio_contrato?: string
          duracao_contrato_dias?: number
          id?: string
          limite_km_semanal?: number
          modelo: string
          preco_combustivel?: number
          updated_at?: string
          user_id: string
          valor_km_excedido?: number
        }
        Update: {
          aluguel_semanal?: number
          consumo_km_l?: number
          created_at?: string
          data_inicio_contrato?: string
          duracao_contrato_dias?: number
          id?: string
          limite_km_semanal?: number
          modelo?: string
          preco_combustivel?: number
          updated_at?: string
          user_id?: string
          valor_km_excedido?: number
        }
        Relationships: []
      }
      corridas_individuais: {
        Row: {
          consumo_km_l: number
          created_at: string | null
          data_hora: string
          entrada_diaria_id: number | null
          horario: string | null
          id: number
          km_rodados: number
          numero_viagens: number
          plataforma: string
          preco_combustivel: number
          tempo_trabalhado: number
          user_id: string
          valor: number
        }
        Insert: {
          consumo_km_l?: number
          created_at?: string | null
          data_hora?: string
          entrada_diaria_id?: number | null
          horario?: string | null
          id?: number
          km_rodados?: number
          numero_viagens?: number
          plataforma: string
          preco_combustivel?: number
          tempo_trabalhado?: number
          user_id: string
          valor?: number
        }
        Update: {
          consumo_km_l?: number
          created_at?: string | null
          data_hora?: string
          entrada_diaria_id?: number | null
          horario?: string | null
          id?: number
          km_rodados?: number
          numero_viagens?: number
          plataforma?: string
          preco_combustivel?: number
          tempo_trabalhado?: number
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_corridas_entrada_diaria"
            columns: ["entrada_diaria_id"]
            isOneToOne: false
            referencedRelation: "entradas_diarias"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas_diarias: {
        Row: {
          created_at: string | null
          data: string
          ganhos_99: number
          ganhos_uber: number
          id: number
          km_rodados: number
          km_rodados_99: number
          km_rodados_uber: number
          numero_corridas_99: number
          numero_corridas_uber: number
          tempo_trabalhado: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: string
          ganhos_99?: number
          ganhos_uber?: number
          id?: number
          km_rodados?: number
          km_rodados_99?: number
          km_rodados_uber?: number
          numero_corridas_99?: number
          numero_corridas_uber?: number
          tempo_trabalhado?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: string
          ganhos_99?: number
          ganhos_uber?: number
          id?: number
          km_rodados?: number
          km_rodados_99?: number
          km_rodados_uber?: number
          numero_corridas_99?: number
          numero_corridas_uber?: number
          tempo_trabalhado?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gastos_avulsos: {
        Row: {
          categoria: string
          created_at: string | null
          data: string
          entrada_diaria_id: number | null
          id: number
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data: string
          entrada_diaria_id?: number | null
          id?: number
          user_id: string
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data?: string
          entrada_diaria_id?: number | null
          id?: number
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "gastos_avulsos_entrada_diaria_id_fkey"
            columns: ["entrada_diaria_id"]
            isOneToOne: false
            referencedRelation: "entradas_diarias"
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicEnumNameOrOptions["schema"]] & PublicSchema)["Enums"][EnumName] extends {
      [key: string]: infer R
    }
    ? R
    : never
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions] extends {
        [key: string]: infer R
      }
      ? R
      : never
    : never