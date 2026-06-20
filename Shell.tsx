import Head from "next/head";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  showBack?: boolean;
}

export function Shell({ title, subtitle, children, showBack = false }: Props) {
  return (
    <>
      <Head>
        <title>{title} — Anfiteatro de Villa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#ea580c" />
        <meta property="og:title" content={title} />
        {subtitle && <meta property="og:description" content={subtitle} />}
      </Head>
      <div className="shell py-6 sm:py-10">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/menu" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
              <span className="font-serif text-lg">A</span>
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-black uppercase tracking-widest text-ink-400">Anfiteatro</div>
              <div className="text-sm font-black text-ink-900">de Villa</div>
            </div>
          </Link>
          {showBack && (
            <Link href="/menu" className="text-xs font-bold text-ink-600 hover:text-ink-900 inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </Link>
          )}
        </header>
        <main>{children}</main>
      </div>
    </>
  );
}