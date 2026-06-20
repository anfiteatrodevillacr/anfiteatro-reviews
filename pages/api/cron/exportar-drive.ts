// API endpoint: ejecuta el export diario a Google Drive.
// Protegido por CRON_SECRET — lo llama Vercel Cron (o un cron externo).
// POST /api/cron/exportar-drive — sin body, requiere header x-cron-secret.

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSupabase } from "../../../lib/supabase-server";
import { jsonError, jsonOk } from "../../../lib/validate";

const DRIVE_ID = process.env.ANFITEATRO_DRIVE_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return jsonError(res, "POST only", 405);

  const secret = process.env.CRON_SECRET;
  if (!secret) return jsonError(res, "CRON_SECRET no configurado en Vercel", 500);
  if (req.headers["x-cron-secret"] !== secret) return jsonError(res, "Unauthorized", 401);

  if (!DRIVE_ID) return jsonError(res, "ANFITEATRO_DRIVE_ID no configurado", 500);

  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("resenas")
    .select("id, canal, destino, estrellas, estrellas_servicio, estrellas_comida, resolvio, comentario, salonero_id, idioma, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) return jsonError(res, "Error al leer resenas", 500);

  // armar CSV en memoria
  const headers = ["id","canal","destino","estrellas","estrellas_servicio","estrellas_comida","resolvio","comentario","salonero_id","idioma","created_at"];
  const rows = [headers.join(",")];
  for (const r of data ?? []) {
    const row = [
      r.id, r.canal, r.destino, r.estrellas,
      r.estrellas_servicio ?? "", r.estrellas_comida ?? "",
      r.resolvio === null ? "" : r.resolvio,
      csvEscape(r.comentario ?? ""),
      r.salonero_id ?? "", r.idioma, r.created_at,
    ];
    rows.push(row.join(","));
  }
  const csv = rows.join("\n");

  // subir a Google Drive via REST API (oauth2 con service account o token)
  // TODO: implementar upload usando GOOGLE_SERVICE_ACCOUNT del proyecto
  // Por ahora, log al server. El siguiente paso es wire-up.

  console.log(`[exportar-drive] ${rows.length - 1} resenas. Drive=${DRIVE_ID}. CSV size=${csv.length}`);

  return jsonOk(res, {
    drive_id: DRIVE_ID,
    filas: rows.length - 1,
    csv_bytes: csv.length,
    note: "Upload a Drive pendiente de wire-up (proximo paso). Ver docs/DEPLOY.md.",
  });
}

function csvEscape(s: string): string {
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}