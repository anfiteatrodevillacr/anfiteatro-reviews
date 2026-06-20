import { useState } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { Shell } from "../components/Shell";
import { Stars } from "../components/Stars";
import { CodigoCard } from "../components/CodigoCard";
import { COPY } from "../lib/copy";
import { Send, User } from "lucide-react";

export default function RestaurantePage({ saloneroNombre, saloneroSlug }: { saloneroNombre: string | null; saloneroSlug: string | null }) {
  const [estrellasServicio, setEstrellasServicio] = useState(0);
  const [estrellasComida, setEstrellasComida] = useState(0);
  const [comentario, setComentario] = useState("");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const limit = Number(process.env.NEXT_PUBLIC_MAX_COMMENT_CHARS ?? "400");

  async function enviar() {
    if (estrellasServicio === 0 || estrellasComida === 0) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: "restaurante",
          destino: "privada",
          estrellas: Math.round((estrellasServicio + estrellasComida) / 2),
          estrellas_servicio: estrellasServicio,
          estrellas_comida: estrellasComida,
          comentario: comentario.trim() || null,
          salonero_slug: saloneroSlug,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        if (json.data?.codigo) setCodigo(json.data.codigo);
        setEnviado(true);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Shell title={COPY.restaurante.titulo} showBack>
      <div className="text-center mb-6">
        <p className="pill mb-3">{COPY.restaurante.titulo}</p>
        <h1 className="text-3xl sm:text-4xl font-black text-ink-900 mb-1">{COPY.restaurante.titulo}</h1>
        <p className="text-sm text-ink-600">{COPY.marca.nombre}</p>
        <p className="text-xs text-ink-400 mt-1">{COPY.marca.ciudad}</p>
        {saloneroNombre && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-black text-brand-700">
            <User className="w-3.5 h-3.5" /> {COPY.restaurante.salonero_badge}{saloneroNombre}
          </p>
        )}
      </div>

      {!enviado ? (
        <div className="card space-y-6">
          <Stars value={estrellasServicio} onChange={setEstrellasServicio} label={COPY.restaurante.servicio_label} />
          <Stars value={estrellasComida}   onChange={setEstrellasComida}   label={COPY.restaurante.comida_label} />
          <div>
            <label className="pill block w-fit mb-2">{COPY.restaurante.comentario_label}</label>
            <textarea
              className="textarea min-h-[110px]"
              maxLength={limit}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={COPY.restaurante.comentario_placeholder}
            />
            <p className="mt-1 text-[11px] text-ink-400 text-right">{comentario.length} / {limit}</p>
          </div>
          <button
            type="button"
            disabled={estrellasServicio === 0 || estrellasComida === 0 || enviando}
            onClick={enviar}
            className="btn-primary w-full"
          >
            <Send className="w-4 h-4" /> {enviando ? "Enviando..." : COPY.restaurante.submit}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card text-center">
            <div className="text-5xl mb-2">🙏</div>
            <h2 className="font-black text-ink-900 text-lg mb-1">{COPY.restaurante.gracias_titulo}</h2>
            <p className="text-sm text-ink-600">{COPY.restaurante.gracias_body}</p>
            <div className="flex justify-center gap-4 mt-3 text-xs">
              <div><p className="text-ink-400">Servicio</p><Stars value={estrellasServicio} onChange={() => {}} size="sm" /></div>
              <div><p className="text-ink-400">Comida</p><Stars value={estrellasComida} onChange={() => {}} size="sm" /></div>
            </div>
          </div>
          {codigo && (
            <CodigoCard
              codigo={codigo}
              titulo={COPY.restaurante.codigo_titulo}
              valido={COPY.restaurante.codigo_valido}
            />
          )}
        </div>
      )}
    </Shell>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  res.setHeader("Cache-Control", "no-store");
  const saloneroSlug = typeof query.salonero === "string" ? query.salonero.slice(0, 64) : null;
  return { props: { saloneroSlug, saloneroNombre: saloneroSlug } };
};