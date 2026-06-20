// POST /api/codigos/canjear — operador del equipo canjea un codigo en el dashboard
// Body: { codigo, canjeado_por?, notas? }

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSupabase } from "../../../lib/supabase-server";
import { jsonError, jsonOk } from "../../../lib/validate";

interface Body {
  codigo: string;
  canjeado_por?: string;
  notas?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return jsonError(res, "Metodo no permitido", 405);

  const body = (req.body ?? {}) as Body;
  if (!body.codigo || typeof body.codigo !== "string") return jsonError(res, "Falta codigo", 400);
  const codigo = body.codigo.trim().toUpperCase().slice(0, 32);
  if (codigo.length < 8) return jsonError(res, "Codigo invalido", 400);

  const sb = getServerSupabase();
  const { data, error } = await sb.rpc("centro_resenas.canjear_codigo" as never, {
    p_codigo: codigo,
    p_canjeado_por: body.canjeado_por ?? null,
    p_notas: body.notas ?? null,
  });

  if (error) {
    console.error("[codigos/canjear] rpc error:", error);
    return jsonError(res, "Error al canjear codigo", 500);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.ok) return jsonError(res, row?.mensaje ?? "No se pudo canjear", 400);

  return jsonOk(res, { mensaje: row.mensaje, tipo: row.tipo, resena_id: row.resena_id });
}