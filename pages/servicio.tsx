import { useState } from "react";
import type { GetServerSideProps } from "next";
import { Shell } from "../components/Shell";
import { Stars } from "../components/Stars";
import { YesNoButton } from "../components/YesNoButton";
import { COPY } from "../lib/copy";
import { Send } from "lucide-react";

export default function ServicioPage() {
  const [estrellas, setEstrellas] = useState(0);
  const [resolvio, setResolvio] = useState<boolean | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const limit = Number(process.env.NEXT_PUBLIC_MAX_COMMENT_CHARS ?? "400");

  async function enviar() {
    if (estrellas === 0 || resolvio === null) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: "servicio",
          destino: "privada",
          estrellas,
          resolvio,
          comentario: comentario.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.ok) setEnviado(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Shell title={COPY.servicio.titulo} showBack>
      <div className="text-center mb-6">
        <p className="pill mb-3">{COPY.servicio.titulo}</p>
        <h1 className="text-3xl sm:text-4xl font-black text-ink-900 mb-1">{COPY.servicio.titulo}</h1>
        <p className="text-sm text-ink-600">{COPY.marca.nombre}</p>
        <p className="text-xs text-ink-400 mt-1">{COPY.marca.ciudad}</p>
      </div>

      {!enviado ? (
        <div className="card space-y-6">
          <Stars value={estrellas} onChange={setEstrellas} label={COPY.servicio.estrellas_label} />

          <div>
            <p className="pill block w-fit mb-2 mx-auto">{COPY.servicio.resolvio_label}</p>
            <div className="grid grid-cols-2 gap-2">
              <YesNoButton label={COPY.servicio.resolvio_si} tone="yes" selected={resolvio === true}  onClick={() => setResolvio(true)} />
              <YesNoButton label={COPY.servicio.resolvio_no} tone="no"  selected={resolvio === false} onClick={() => setResolvio(false)} />
            </div>
          </div>

          <p className="text-sm text-ink-600 text-center">{COPY.servicio.comentario_label}</p>

          <button
            type="button"
            disabled={estrellas === 0 || resolvio === null || enviando}
            onClick={enviar}
            className="btn-primary w-full"
          >
            <Send className="w-4 h-4" /> {enviando ? "Enviando..." : COPY.servicio.submit}
          </button>
        </div>
      ) : (
        <div className="card text-center">
          <div className="text-5xl mb-2">🙏</div>
          <h2 className="font-black text-ink-900 text-lg mb-1">{COPY.servicio.gracias_titulo}</h2>
          <p className="text-sm text-ink-600">{COPY.servicio.gracias_body}</p>
          <div className="flex justify-center mt-3">
            <Stars value={estrellas} onChange={() => {}} size="sm" />
          </div>
        </div>
      )}
    </Shell>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Cache-Control", "no-store");
  return { props: {} };
};