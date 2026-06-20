import { useState } from "react";
import type { GetServerSideProps } from "next";
import { Shell } from "../components/Shell";
import { Stars } from "../components/Stars";
import { CodigoCard } from "../components/CodigoCard";
import { COPY } from "../lib/copy";
import { Send } from "lucide-react";

const MAX = 600;

export default function EventoPage() {
  const [estrellasExp, setEstrellasExp] = useState(0);
  const [estrellasServ, setEstrellasServ] = useState(0);
  const [comentario, setComentario] = useState("");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (estrellasExp === 0 || estrellasServ === 0) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: "evento",
          destino: "privada",
          estrellas: Math.round((estrellasExp + estrellasServ) / 2),
          estrellas_servicio: estrellasServ,
          comentario: comentario.trim() || null,
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
    <Shell title={COPY.evento.titulo} showBack>
      <div className="text-center mb-6">
        <p className="pill mb-3">{COPY.evento.titulo}</p>
        <h1 className="text-3xl sm:text-4xl font-black text-ink-900 mb-1">{COPY.evento.titulo}</h1>
        <p className="text-sm text-ink-600">{COPY.marca.nombre}</p>
        <p className="text-xs text-ink-400 mt-1">{COPY.marca.ciudad}</p>
      </div>

      {!enviado ? (
        <div className="card space-y-6">
          <Stars value={estrellasExp}  onChange={setEstrellasExp}  label={COPY.evento.experiencia_label} />
          <Stars value={estrellasServ} onChange={setEstrellasServ} label={COPY.evento.servicio_label} />
          <div>
            <label className="pill block w-fit mb-2">{COPY.evento.comentario_label}</label>
            <textarea
              className="textarea min-h-[110px]"
              maxLength={MAX}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-ink-400 text-right">{comentario.length} / {MAX}</p>
          </div>
          <button
            type="button"
            disabled={estrellasExp === 0 || estrellasServ === 0 || enviando}
            onClick={enviar}
            className="btn-primary w-full"
          >
            <Send className="w-4 h-4" /> {enviando ? "Enviando..." : COPY.evento.submit}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card text-center">
            <div className="text-5xl mb-2">🙏</div>
            <h2 className="font-black text-ink-900 text-lg mb-1">{COPY.evento.gracias_titulo}</h2>
            <p className="text-sm text-ink-600">{COPY.evento.gracias_body}</p>
          </div>
          {codigo && (
            <CodigoCard
              codigo={codigo}
              titulo={COPY.evento.codigo_titulo}
              valido={COPY.evento.codigo_valido}
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