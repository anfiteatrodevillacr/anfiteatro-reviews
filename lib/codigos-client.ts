// Helper client-side para generar codigos visibles al cliente.
// NO usar en server-side: el server genera con lib/codigos.ts (con CORTESIA_SECRET).

import { createHash } from "crypto";

export function generarCodigoCortesiaClient(prefijo: "ANFI" | "REST" | "CAVE" | "TOUR" = "ANFI"): string {
  const a = createHash("sha256")
    .update(Date.now().toString())
    .update(Math.random().toString())
    .digest("base64url")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
  const b = createHash("sha256")
    .update(Date.now().toString() + Math.random().toString())
    .digest("base64url")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
  return `${prefijo}-${a}-${b}`;
}