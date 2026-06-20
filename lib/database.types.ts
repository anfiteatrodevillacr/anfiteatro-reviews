// Tipos generados manualmente (mirror de supabase/migrations/0001_schema_inicial.sql).
// Para regenerar: `npm run db:types` (requiere supabase CLI).

export type ResenaCanal = "cavernas" | "restaurante" | "evento" | "servicio";
export type ResenaDestino = "publica" | "privada";
export type CodigoTipo = "descuento_cavernas" | "postre_cortesia" | "tour_cortesia";
export type CodigoEstado = "activo" | "canjeado" | "expirado";

export interface Resena {
  id: string;
  canal: ResenaCanal;
  destino: ResenaDestino;
  estrellas: number;
  estrellas_servicio: number | null;
  estrellas_comida: number | null;
  resolvio: boolean | null;
  comentario: string | null;
  salonero_id: string | null;
  idioma: string;
  user_agent: string | null;
  ip_origen: string | null;
  created_at: string;
}

export interface CodigoCortesia {
  id: string;
  codigo: string;
  tipo: CodigoTipo;
  estado: CodigoEstado;
  resena_id: string | null;
  salonero_id: string | null;
  emitido_at: string;
  expira_at: string | null;
  canjeado_at: string | null;
  canjeado_por: string | null;
  notas: string | null;
}

export interface Salonero {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      resenas:          { Row: Resena; Insert: Omit<Resena, "id" | "created_at"> & { id?: string; created_at?: string }; Update: Partial<Resena> };
      codigos_cortesia: { Row: CodigoCortesia; Insert: Omit<CodigoCortesia, "id" | "emitido_at"> & { id?: string; emitido_at?: string }; Update: Partial<CodigoCortesia> };
      saloneros:        { Row: Salonero; Insert: Omit<Salonero, "id" | "created_at"> & { id?: string; created_at?: string }; Update: Partial<Salonero> };
    };
    Functions: {
      crear_resena_con_cortesia: {
        Args: {
          p_canal: ResenaCanal; p_destino: ResenaDestino; p_estrellas: number;
          p_estrellas_servicio?: number | null; p_estrellas_comida?: number | null;
          p_resolvio?: boolean | null; p_comentario?: string | null;
          p_salonero_slug?: string | null; p_idioma?: string;
          p_user_agent?: string | null; p_ip_origen?: string | null;
          p_cortesia_tipo?: CodigoTipo | null; p_cortesia_codigo?: string | null;
        };
        Returns: { resena_id: string; codigo_id: string | null; codigo: string | null }[];
      };
      canjear_codigo: {
        Args: { p_codigo: string; p_canjeado_por?: string | null; p_notas?: string | null };
        Returns: { ok: boolean; mensaje: string; tipo: CodigoTipo | null; resena_id: string | null }[];
      };
    };
  };
}