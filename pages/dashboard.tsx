import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { Shell } from "../components/Shell";
import { COPY } from "../lib/copy";
import { BarChart3, Star, Users, CheckCircle2, AlertCircle, RefreshCw, Ticket } from "lucide-react";

interface ResumenCanal {
  canal: string;
  total: number;
  promedio_estrellas: number;
  publicas: number;
  privadas: number;
  ultima_semana: number;
  ultimo_mes: number;
}
interface SaloneroRow { id: string; nombre: string; slug: string; resenas: number; promedio_estrellas: number; ultima_resena: string | null; }
interface ResenaRaw {
  id: string; canal: string; destino: string; estrellas: number;
  estrellas_servicio: number | null; estrellas_comida: number | null;
  comentario: string | null; created_at: string; salonero_id: string | null;
}

export default function DashboardPage({ saloneros }: { saloneros: SaloneroRow[] }) {
  const [resumen, setResumen] = useState<ResumenCanal[]>([]);
  const [resenas, setResenas] = useState<ResenaRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"resumen" | "resenas" | "codigos" | "saloneros">("resumen");
  const [canjeInput, setCanjeInput] = useState("");
  const [canjeMsg, setCanjeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [canjeLoading, setCanjeLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/metricas");
      const json = await res.json();
      if (json.ok) {
        setResumen(json.data.resumen);
        setResenas(json.data.resenas);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function canjear() {
    if (!canjeInput.trim()) return;
    setCanjeLoading(true);
    setCanjeMsg(null);
    try {
      const res = await fetch("/api/codigos/canjear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: canjeInput.trim().toUpperCase() }),
      });
      const json = await res.json();
      setCanjeMsg({ ok: !!json.ok, text: json.ok ? (json.data?.mensaje ?? "OK") : (json.error ?? "Error") });
      if (json.ok) setCanjeInput("");
      load();
    } finally {
      setCanjeLoading(false);
    }
  }

  return (
    <Shell title={COPY.dashboard.titulo} showBack>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="pill mb-2">Centro de Reseñas · Equipo</p>
          <h1 className="text-2xl sm:text-3xl font-black text-ink-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" /> {COPY.dashboard.titulo}
          </h1>
        </div>
        <button type="button" onClick={load} className="btn-ghost !px-3 !py-2 !text-xs" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>

      <div className="flex gap-1 mb-5 bg-white rounded-xl ring-1 ring-ink-100 p-1">
        {([
          ["resumen", COPY.dashboard.tab_resumen],
          ["resenas", COPY.dashboard.tab_resenas],
          ["codigos", COPY.dashboard.tab_codigos],
          ["saloneros", COPY.dashboard.tab_saloneros],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
              tab === k ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "resumen" && <ResumenTab resumen={resumen} loading={loading} />}
      {tab === "resenas" && <ResenasTab resenas={resenas} saloneros={saloneros} loading={loading} />}
      {tab === "codigos" && <CodigosTab canjeInput={canjeInput} setCanjeInput={setCanjeInput} canjear={canjear} canjeMsg={canjeMsg} canjeLoading={canjeLoading} />}
      {tab === "saloneros" && <SalonerosTab saloneros={saloneros} />}
    </Shell>
  );
}

function ResumenTab({ resumen, loading }: { resumen: ResumenCanal[]; loading: boolean }) {
  if (loading) return <p className="text-center text-ink-400 text-sm py-8">Cargando…</p>;
  const totales = resumen.reduce((acc, r) => ({
    total: acc.total + r.total,
    ultima_semana: acc.ultima_semana + r.ultima_semana,
    ultimo_mes: acc.ultimo_mes + r.ultimo_mes,
  }), { total: 0, ultima_semana: 0, ultimo_mes: 0 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Total" value={totales.total} />
        <Stat label="Última semana" value={totales.ultima_semana} />
        <Stat label="Último mes" value={totales.ultimo_mes} />
      </div>
      <div className="space-y-2">
        {resumen.map((r) => (
          <div key={r.canal} className="card !p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-black text-ink-900 capitalize">{r.canal}</p>
              <span className="pill"><Star className="w-3 h-3" /> {Number(r.promedio_estrellas ?? 0).toFixed(1)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <Stat label="Total" value={r.total} compact />
              <Stat label="Púb." value={r.publicas} compact />
              <Stat label="Priv." value={r.privadas} compact />
              <Stat label="7d" value={r.ultima_semana} compact />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResenasTab({ resenas, saloneros, loading }: { resenas: ResenaRaw[]; saloneroSlugById?: unknown; saloneros: SaloneroRow[]; loading: boolean }) {
  if (loading) return <p className="text-center text-ink-400 text-sm py-8">Cargando…</p>;
  const map = new Map(saloneros.map(s => [s.id, s.nombre]));
  return (
    <div className="space-y-2">
      {resenas.length === 0 && <p className="text-center text-ink-400 text-sm py-8">Aún no hay reseñas</p>}
      {resenas.map((r) => (
        <div key={r.id} className="card !p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="pill capitalize">{r.canal}</span>
            <span className="text-[10px] font-bold text-ink-400">{new Date(r.created_at).toLocaleString("es-CR")}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-black text-ink-900">{"★".repeat(r.estrellas)}<span className="text-ink-100">{"★".repeat(5 - r.estrellas)}</span></span>
            {r.estrellas_servicio && <span className="text-ink-600">Serv: {r.estrellas_servicio}★</span>}
            {r.estrellas_comida   && <span className="text-ink-600">Com: {r.estrellas_comida}★</span>}
            <span className={`pill !text-[10px] ${r.destino === "publica" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {r.destino}
            </span>
            {r.salonero_id && <span className="text-ink-600">· {map.get(r.salonero_id) ?? "?"}</span>}
          </div>
          {r.comentario && <p className="mt-2 text-sm text-ink-900">{r.comentario}</p>}
        </div>
      ))}
    </div>
  );
}

function CodigosTab({ canjeInput, setCanjeInput, canjear, canjeMsg, canjeLoading }: {
  canjeInput: string; setCanjeInput: (s: string) => void; canjear: () => void; canjeMsg: { ok: boolean; text: string } | null; canjeLoading: boolean;
}) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Ticket className="w-5 h-5 text-brand-600" />
        <h2 className="font-black text-ink-900">{COPY.dashboard.canje_label}</h2>
      </div>
      <div className="flex gap-2">
        <input
          className="input font-mono uppercase"
          placeholder={COPY.dashboard.canje_placeholder}
          value={canjeInput}
          onChange={(e) => setCanjeInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canjear()}
        />
        <button type="button" onClick={canjear} disabled={canjeLoading || !canjeInput.trim()} className="btn-primary !px-5">
          {canjeLoading ? "..." : COPY.dashboard.canje_btn}
        </button>
      </div>
      {canjeMsg && (
        <div className={`flex items-center gap-2 rounded-xl p-3 text-sm font-bold ${canjeMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {canjeMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {canjeMsg.text}
        </div>
      )}
      <p className="text-[11px] text-ink-400">
        Tip: el código se copia automáticamente al celular del cliente después de enviar su reseña.
      </p>
    </div>
  );
}

function SalonerosTab({ saloneros }: { saloneros: SaloneroRow[] }) {
  return (
    <div className="card space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5 text-brand-600" />
        <h2 className="font-black text-ink-900">Saloneros activos</h2>
      </div>
      {saloneros.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
          <div>
            <p className="font-black text-ink-900">{s.nombre}</p>
            <p className="text-[11px] font-mono text-ink-400">?salonero={s.slug}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-ink-900">{s.resenas} reseñas</p>
            <p className="text-[11px] text-ink-400">{Number(s.promedio_estrellas ?? 0).toFixed(1)}★ promedio</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, compact }: { label: string; value: number; compact?: boolean }) {
  return (
    <div className={compact ? "rounded-lg bg-ink-50 px-2 py-1.5" : "card !p-3 text-center"}>
      <p className={`font-black text-ink-900 ${compact ? "text-base" : "text-2xl"}`}>{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-ink-400">{label}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  // saloneros se hidrata en el cliente desde /api/metricas
  return { props: { saloneros: [] } };
};