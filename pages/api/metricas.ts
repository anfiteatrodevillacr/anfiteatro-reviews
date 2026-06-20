// GET /api/metricas — devuelve resumen + ultimas resenas + saloneros
// Usado por el dashboard.

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSupabase } from "../../lib/supabase-server";
import { jsonError, jsonOk } from "../../lib/validate";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return jsonError(res, "Metodo no permitido", 405);

  const sb = getServerSupabase();

  const [resumenRes, resenasRes, salonerosRes] = await Promise.all([
    sb.from("v_resumen_canal").select("*"),
    sb.from("resenas").select("id, canal, destino, estrellas, estrellas_servicio, estrellas_comida, comentario, salonero_id, created_at").order("created_at", { ascending: false }).limit(100),
    sb.from("v_resumen_salonero").select("*").order("resenas", { ascending: false }),
  ]);

  if (resumenRes.error || resenasRes.error || salonerosRes.error) {
    console.error("[metricas]", { resumenRes: resumenRes.error, resenasRes: resenasRes.error, salonerosRes: salonerosRes.error });
    return jsonError(res, "Error al leer metricas", 500);
  }

  return jsonOk(res, {
    resumen: resumenRes.data ?? [],
    resenas: resenasRes.data ?? [],
    saloneros: salonerosRes.data ?? [],
  });
}