// Generador de codigos de cortesia. Server-side only.
// Formato legible: ANFI-XXXX-XXXX (12 chars + guion cada 4).
// Usa CORTESIA_SECRET como seed; colisiones son improbables pero validadas en DB.

import { createHash } from "node:crypto";

function rand(): string {
  const buf = createHash("sha256")
    .update(process.env.CORTESIA_SECRET ?? "fallback-dev-only")
    .update(Date.now().toString())
    .update(Math.random().toString())
    .digest();
  return buf.toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function generarCodigoCortesia(prefijo: "ANFI" | "REST" | "CAVE" | "TOUR" = "ANFI"): string {
  const a = rand().slice(0, 4);
  const b = rand().slice(0, 4);
  return `${prefijo}-${a}-${b}`;
}