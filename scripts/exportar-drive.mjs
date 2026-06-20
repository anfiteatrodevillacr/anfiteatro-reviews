#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────
// exportar-drive.mjs — exporta las resenas del Centro a Google Drive
//
// Uso:
//   1. Configurar .env.local con SUPABASE_* y GOOGLE_SERVICE_ACCOUNT_JSON
//   2. node scripts/exportar-drive.mjs [--dry-run]
//
// El service account debe tener acceso de Editor a la carpeta del Anfiteatro
// (compartila desde Drive UI con el email del service account).
// ─────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { argv, env } from "node:process";

const DRY_RUN = argv.includes("--dry-run");

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/i);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function csvEscape(s) {
  if (s == null) return "";
  const str = String(s);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  loadEnvLocal();

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const driveFolder = env.ANFITEATRO_DRIVE_ID;
  const saJsonPath  = env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH ?? "./google-sa.json";

  if (!supabaseUrl || !supabaseKey) throw new Error("Faltan SUPABASE_* en .env.local");
  if (!driveFolder)                       throw new Error("Falta ANFITEATRO_DRIVE_ID en .env.local");

  console.log("→ Leyendo resenas desde Supabase...");
  const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("resenas")
    .select("id, canal, destino, estrellas, estrellas_servicio, estrellas_comida, resolvio, comentario, salonero_id, idioma, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  console.log(`  ${(data ?? []).length} resenas`);

  const headers = ["id","canal","destino","estrellas","estrellas_servicio","estrellas_comida","resolvio","comentario","salonero_id","idioma","created_at"];
  const rows = [headers.join(",")];
  for (const r of data ?? []) {
    rows.push([
      csvEscape(r.id), csvEscape(r.canal), csvEscape(r.destino),
      r.estrellas, r.estrellas_servicio ?? "", r.estrellas_comida ?? "",
      r.resolvio === null ? "" : r.resolvio,
      csvEscape(r.comentario ?? ""),
      csvEscape(r.salonero_id ?? ""), csvEscape(r.idioma),
      csvEscape(r.created_at),
    ].join(","));
  }
  const csv = rows.join("\n");
  const filename = `resenas-${new Date().toISOString().slice(0, 10)}.csv`;

  if (DRY_RUN) {
    console.log(`[dry-run] Generaria ${filename} (${csv.length} bytes, ${rows.length - 1} filas) en Drive ${driveFolder}`);
    return;
  }

  if (!existsSync(saJsonPath)) {
    throw new Error(`Falta ${saJsonPath} (Service Account JSON de Google). Bajar de Google Cloud Console.`);
  }
  const sa = JSON.parse(readFileSync(saJsonPath, "utf8"));

  const auth = new google.auth.GoogleAuth({
    credentials: sa,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [driveFolder],
      mimeType: "text/csv",
    },
    media: { mimeType: "text/csv", body: csv },
    fields: "id, webViewLink",
  });

  console.log(`✓ Subido: ${res.data.name}`);
  console.log(`  ID: ${res.data.id}`);
  console.log(`  Link: ${res.data.webViewLink}`);
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });