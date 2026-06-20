// Tipos generados manualmente (mirror de supabase/migrations/0001_schema_inicial.sql + 0002).
// Las tablas y funciones viven en el schema `centro_resenas` (aislado del ERP).
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
  // Schema `centro_resenas` (aislado del ERP `public`).
  // NOTA: las funciones se llaman con prefijo `centro_resenas.nombre`
  // (ver pages/api/resenas.ts y pages/api/codigos/canjear.ts).
  [schema: string]: {
    Tables: {
      resenas:          { Row: Resena; Insert: Omit<Resena, "id" | "created_at"> & { id?: string; created_at?: string }; Update: Partial<Resena> };
      codigos_cortesia: { Row: CodigoCortesia; Insert: Omit<CodigoCortesia, "id" | "emitido_at"> & { id?: string; emitido_at?: string }; Update: Partial<CodigoCortesia> };
      saloneros:        { Row: Salonero; Insert: Omit<Salonero, "id" | "created_at"> & { id?: string; created_at?: string }; Update: Partial<Salonero> };
    };
    Views: {
      v_resumen_canal:    { Row: any };
      v_resumen_salonero: { Row: any };
    };
    Functions: {
      [fn_name: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      resena_canal: ResenaCanal;
      resena_destino: ResenaDestino;
      codigo_tipo: CodigoTipo;
      codigo_estado: CodigoEstado;
    };
  };
}
