import { useState } from "react";
import type { GetServerSideProps } from "next";
import { Shell } from "../components/Shell";
import { Stars } from "../components/Stars";
import { YesNoButton } from "../components/YesNoButton";
import { CodigoCard } from "../components/CodigoCard";
import { COPY } from "../lib/copy";
import { generarCodigoCortesiaClient } from "../lib/codigos-client";
import { ExternalLink, Send } from "lucide-react";

type Paso = "si_no" | "detalle" | "redirigir" | "gracias";

export default function CavernasPage() {
  const [paso, setPaso] = useState<Paso>("si_no");
  const [recomienda, setRecomienda] = useState<boolean | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const limit = Number(process.env.NEXT_PUBLIC_MAX_COMMENT_CHARS ?? "400");

  async function enviar(d: "publica" | "privada") {
    if (estrellas === 0) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: "cavernas",
          destino: d,
          estrellas,
          comentario: comentario.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        if (json.data?.codigo) setCodigo(json.data.codigo);
        setPaso("gracias");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Shell title={COPY.cavernas.titulo} showBack>
      <div className="text-center mb-6">
        <p className="pill mb-3">Las Cavernas del Cañón</p>
        <h1 className="text-3xl sm:text-4xl font-black text-ink-900 mb-1">{COPY.cavernas.titulo}</h1>
        <p className="text-sm text-ink-600">{COPY.cavernas.subtitulo}</p>
        <p className="text-xs text-ink-400 mt-1">{COPY.marca.ciudad}</p>
      </div>

      {paso === "si_no" && (
        <div className="card space-y-3">
          <p className="text-center text-base font-black text-ink-900">{COPY.cavernas.pregunta}</p>
          <div className="space-y-2">
            <YesNoButton label={COPY.cavernas.yes} tone="yes"  selected={recomienda === true}  onClick={() => { setRecomienda(true);  setPaso("detalle"); }} />
            <YesNoButton label={COPY.cavernas.no}  tone="no"   selected={recomienda === false} onClick={() => { setRecomienda(false); setPaso("detalle"); }} />
          </div>
        </div>
      )}

      {paso === "detalle" && (
        <div className="card space-y-5">
          <p className="pill mx-auto block w-fit">{COPY.cavernas.header_privado}</p>
          <Stars value={estrellas} onChange={setEstrellas} label={COPY.cavernas.stars_label} />
          <div>
            <label className="pill block w-fit mb-2">{COPY.cavernas.textarea_label}</label>
            <textarea
              className="textarea min-h-[120px]"
              maxLength={limit}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-ink-400 text-right">{comentario.length} / {limit}</p>
          </div>

          {recomienda === true && (
            <button
              type="button"
              disabled={estrellas === 0 || enviando}
              onClick={() => setPaso("redirigir")}
              className="btn-primary w-full"
            >
              <Send className="w-4 h-4" /> Continuar
            </button>
          )}

          {recomienda === false && (
            <button
              type="button"
              disabled={estrellas === 0 || enviando}
              onClick={() => enviar("privada")}
              className="btn-primary w-full"
            >
              {enviando ? "Enviando..." : COPY.cavernas.submit}
            </button>
          )}
        </div>
      )}

      {paso === "redirigir" && (
        <div className="card space-y-4">
          <p className="text-center font-black text-ink-900">¡Gracias! Compartí tu experiencia:</p>
          <a
            href={process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ?? "#"}
            target="_blank"
            rel="noreferrer"
            onClick={() => enviar("publica")}
            className="btn-primary w-full"
          >
            <ExternalLink className="w-4 h-4" /> {COPY.cavernas.redirigir_google}
          </a>
          <a
            href={process.env.NEXT_PUBLIC_TRIPADVISOR_REVIEW_URL ?? "#"}
            target="_blank"
            rel="noreferrer"
            onClick={() => enviar("publica")}
            className="btn-ghost w-full"
          >
            <ExternalLink className="w-4 h-4" /> {COPY.cavernas.redirigir_tripadvisor}
          </a>
          <p className="text-[11px] text-ink-400 text-center">
            Al hacer click guardaremos tu reseña ({estrellas}★) como pública.
          </p>
        </div>
      )}

      {paso === "gracias" && (
        <div className="space-y-4">
          <div className="card text-center">
            <div className="text-5xl mb-2">🙏</div>
            <h2 className="font-black text-ink-900 text-lg mb-1">{COPY.cavernas.gracias_titulo}</h2>
            <p className="text-sm text-ink-600">{COPY.cavernas.gracias_body}</p>
            <div className="flex justify-center mt-3">
              <Stars value={estrellas} onChange={() => {}} size="sm" />
            </div>
          </div>
          {codigo && (
            <CodigoCard
              codigo={codigo}
              titulo={COPY.cavernas.codigo_titulo}
              valido={COPY.cavernas.codigo_valido}
            />
          )}
        </div>
      )}
    </Shell>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Cache-Control", "no-store");
  return { props: {} };
};