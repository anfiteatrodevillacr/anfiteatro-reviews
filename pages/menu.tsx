import type { GetStaticProps } from "next";
import Link from "next/link";
import { Shell } from "../components/Shell";
import { CopyButton } from "../components/CopyButton";
import { COPY } from "../lib/copy";
import { Mountain, Utensils, CalendarDays, MessageSquare, BarChart3, ArrowUpRight, Share2, Lock } from "lucide-react";

interface Pantalla {
  key: string;
  emoji: string;
  shortLabel: string;
  titulo: string;
  descripcion: string;
  href: string;
  tone: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const PANTALLAS_CLIENTE: Pantalla[] = [
  { key: "tour",       emoji: "🗻", shortLabel: "Tour",         titulo: COPY.cavernas.titulo,    descripcion: "Filtro Si/No · Google · TripAdvisor · Codigo 10% descuento", href: "/",             tone: "bg-yellow-500",  Icon: Mountain },
  { key: "rest",       emoji: "🍷", shortLabel: "Restaurantes", titulo: COPY.restaurante.titulo, descripcion: "Servicio · Comida · Postre de cortesia",                      href: "/restaurante",  tone: "bg-orange-500",  Icon: Utensils },
  { key: "evento",     emoji: "🎭", shortLabel: "Evento",       titulo: COPY.evento.titulo,      descripcion: "Experiencia · Servicio · Comentarios libres",                  href: "/evento",       tone: "bg-violet-500",  Icon: CalendarDays },
  { key: "servicio",   emoji: "💬", shortLabel: "Servicio",     titulo: COPY.servicio.titulo,    descripcion: "Para evaluar atencion post-consulta · sin codigo",              href: "/servicio",     tone: "bg-sky-500",     Icon: MessageSquare },
];

const PANTALLAS_EQUIPO: Pantalla[] = [
  { key: "dashboard",  emoji: "📊", shortLabel: "Dashboard",    titulo: "Panel de Metricas",       descripcion: "Estadisticas · Feedback privado · Canje de codigos",            href: "/dashboard",    tone: "bg-emerald-500", Icon: BarChart3 },
];

interface Props {
  baseUrl: string;
}

export default function MenuPage({ baseUrl }: Props) {
  return (
    <Shell title={COPY.menu.titulo} subtitle={COPY.menu.subtitulo}>
      <div className="mb-6 text-center">
        <p className="pill mb-3"><Lock className="w-3 h-3" /> Panel Interno · Equipo</p>
        <h1 className="text-3xl sm:text-4xl font-black text-ink-900 mb-2">{COPY.menu.titulo}</h1>
        <p className="text-sm text-ink-600">{COPY.menu.subtitulo}</p>
      </div>

      <Seccion titulo={COPY.menu.cliente_titulo} count={COPY.menu.cliente_count} items={PANTALLAS_CLIENTE} baseUrl={baseUrl} />
      <Seccion titulo={COPY.menu.equipo_titulo}  count={COPY.menu.equipo_count}  items={PANTALLAS_EQUIPO}  baseUrl={baseUrl} />

      <footer className="mt-10 text-center text-xs text-ink-600">
        <p className="font-black text-ink-900">{COPY.marca.nombre}</p>
        <p>{COPY.marca.ciudad}</p>
        <p className="mt-3 max-w-xs mx-auto">{COPY.menu.footer}</p>
      </footer>
    </Shell>
  );
}

function Seccion({ titulo, count, items, baseUrl }: { titulo: string; count: number; items: Pantalla[]; baseUrl: string }) {
  return (
    <section className="mb-7">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-ink-400">{titulo}</h2>
        <span className="text-[11px] font-black text-ink-400">· {count}</span>
      </div>
      <div className="space-y-3">
        {items.map((p) => <Fila key={p.key} p={p} baseUrl={baseUrl} />)}
      </div>
    </section>
  );
}

function Fila({ p, baseUrl }: { p: Pantalla; baseUrl: string }) {
  const url = `${baseUrl}${p.href}`;
  return (
    <div className="card flex items-start gap-3 hover:shadow-soft transition-shadow">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-soft ${p.tone}`}>
        <span className="text-2xl">{p.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p.Icon className="w-3.5 h-3.5 text-ink-400" />
          <p className="text-[11px] font-black uppercase tracking-widest text-ink-400">{p.shortLabel}</p>
        </div>
        <h3 className="font-black text-ink-900 leading-tight">{p.titulo}</h3>
        <p className="text-xs text-ink-600 mt-1">{p.descripcion}</p>
        <p className="text-[10px] font-mono text-ink-400 mt-2 truncate">{url}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={p.href} className="btn-primary !px-4 !py-2 !text-xs">
            {COPY.menu.open} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <CopyButton text={url} label={COPY.menu.copy} />
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  // En Vercel sera el dominio real; en dev es localhost:3000.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return { props: { baseUrl } };
};