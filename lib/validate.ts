// Helpers compartidos (API routes + componentes).

export const MAX_COMMENT_CHARS = Number(process.env.NEXT_PUBLIC_MAX_COMMENT_CHARS ?? "400");
export const MAX_COMMENT_CHARS_EVENTO = 600;

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function isValidEstrellas(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
}

export function sanitizeComment(text: unknown, max: number = MAX_COMMENT_CHARS): string | null {
  if (typeof text !== "string") return null;
  const trimmed = text.trim().slice(0, max);
  return trimmed.length === 0 ? null : trimmed;
}

export function getClientIp(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    null
  );
}

export function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export function jsonOk(data: unknown, status = 200) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}