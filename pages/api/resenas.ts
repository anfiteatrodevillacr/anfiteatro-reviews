// POST /api/resenas — crear resena + generar codigo de cortesia si aplica
// Body: { canal, destino, estrellas, estrellas_servicio?, estrellas_comida?, resolvio?, comentario?, salonero_slug? }

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSupabase } from "../../../lib/supabase-server";
import { generarCodigoCortesia } from "../../../lib/codigos";
import { isValidEstrellas, sanitizeComment, getClientIp, jsonError, jsonOk, MAX_COMMENT_CHARS_EVENTO } from "../../../lib/validate";
import type { ResenaCanal, ResenaDestino, CodigoTipo } from "../../../lib/database.types";

interface Body {
  canal: ResenaCanal;
  destino: ResenaDestino;
  estrellas: number;
  estrellas_servicio?: number | null;
  estrellas_comida?: number | null;
  resolvio?: boolean | null;
  comentario?: string | null;
  salonero_slug?: string | null;
}

const CANALES_VALIDOS: ResenaCanal[] = ["cavernas", "restaurante", "evento", "servicio"];

function cortesiaParaCanal(canal: ResenaCanal, destino: ResenaDestino): { tipo: CodigoTipo; prefijo: "ANFI" | "REST" | "CAVE" | "TOUR" } | null {
  if (destino === "publica") return null;       // publico = redirigido, sin codigo
  if (canal === "cavernas")    return { tipo: "descuento_cavernas", prefijo: "CAVE" };
  if (canal === "restaurante") return { tipo: "postre_cortesia",    prefijo: "REST" };
  if (canal === "evento")      return { tipo: "tour_cortesia",      prefijo: "TOUR" };
  return null;                                  // servicio: sin codigo
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return jsonError(res, "Metodo no permitido", 405);

  const body = (req.body ?? {}) as Body;

  // ─── validaciones ───
  if (!CANALES_VALIDOS.includes(body.canal)) return jsonError(res, "Canal invalido", 400);
  if (!isValidEstrellas(body.estrellas))     return jsonError(res, "Estrellas invalidas (1-5)", 400);

  const max = body.canal === "evento" ? MAX_COMMENT_CHARS_EVENTO : Number(process.env.NEXT_PUBLIC_MAX_COMMENT_CHARS ?? 400);
  const comentario = sanitizeComment(body.comentario, max);

  // estrellas compuestas (restaurante, evento)
  let estrellasServicio: number | null = null;
  let estrellasComida:   number | null = null;
  if (body.canal === "restaurante" || body.canal === "evento") {
    if (!isValidEstrellas(body.estrellas_servicio ?? NaN)) return jsonError(res, "Estrellas de servicio invalidas", 400);
    estrellasServicio = body.estrellas_servicio!;
  }
  if (body.canal === "restaurante") {
    if (!isValidEstrellas(body.estrellas_comida ?? NaN))   return jsonError(res, "Estrellas de comida invalidas", 400);
    estrellasComida = body.estrellas_comida!;
  }

  // resolvio (servicio)
  let resolvio: boolean | null = null;
  if (body.canal === "servicio") {
    if (typeof body.resolvio !== "boolean") return jsonError(res, "Falta resolvio (true|false)", 400);
    resolvio = body.resolvio;
  }

  // ─── cortesia ───
  const cortesia = cortesiaParaCanal(body.canal, body.destino);
  const codigoGenerado = cortesia ? generarCodigoCortesia(cortesia.prefijo) : null;

  // ─── insercion via RPC ───
  const sb = getServerSupabase();
  const userAgent = (req.headers["user-agent"] ?? "").toString().slice(0, 500);
  const ip = getClientIp(req.headers as unknown as Headers);

  const { data, error } = await sb.rpc("centro_resenas.crear_resena_con_cortesia" as never, {
    p_canal: body.canal,
    p_destino: body.destino,
    p_estrellas: body.estrellas,
    p_estrellas_servicio: estrellasServicio,
    p_estrellas_comida: estrellasComida,
    p_resolvio: resolvio,
    p_comentario: comentario,
    p_salonero_slug: body.salonero_slug ?? null,
    p_user_agent: userAgent,
    p_ip_origen: ip,
    p_cortesia_tipo: cortesia?.tipo ?? null,
    p_cortesia_codigo: codigoGenerado,
  });

  if (error) {
    console.error("[resenas] rpc error:", error);
    return jsonError(res, "Error al guardar la resena", 500);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return jsonOk(res, {
    resena_id: row?.resena_id,
    codigo: row?.codigo ?? null,
    cortesia_tipo: cortesia?.tipo ?? null,
  });
}