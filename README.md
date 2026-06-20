# Anfiteatro Reviews — Centro de Reseñas

Sistema completo de reseñas para el Anfiteatro de Villa, Ciudad Colón, Costa Rica.
Reescrito como proyecto Next.js 14 standalone con Supabase.

## Produccion

- URL cliente: https://anfiteatro-reviews-eight.vercel.app (Vercel)
- URL equipo (dashboard): https://anfiteatro-reviews-eight.vercel.app/dashboard
- URL indice interno: https://anfiteatro-reviews-eight.vercel.app/menu

## Pantallas

| Ruta | Para | Funcion |
|---|---|---|
| `/menu` | equipo | Indice interno con links a todas las pantallas |
| `/` | cliente tour | Filtro Si/No; redirige a Google o TripAdvisor; si No, da 10% descuento |
| `/restaurante` | cliente restaurante | Estrellas servicio + comida; postre de cortesia. Soporta `?salonero=Nombre` |
| `/evento` | cliente evento | Estrellas experiencia + servicio; tour de cortesia |
| `/servicio` | cliente atencion | Estrella + resolvio si/no; feedback interno sin codigo |
| `/dashboard` | equipo | Metricas, feedback privado, canje de codigos, gestion de saloneros |

## Stack

- Next.js 14 (pages router) + TypeScript estricto
- Tailwind CSS 3 con tokens de marca
- Supabase (Postgres + RLS + RPCs) — proyecto separado del ERP Anfiteatro
- Deploy: Vercel
- Backup CSV diario a Google Drive del Anfiteatro

## Comandos

```bash
npm install
npm run dev          # localhost:3000
npm run build
npm run deploy       # Vercel CLI
node scripts/exportar-drive.mjs   # export CSV a Drive (manual o via cron)
```

## Identidad

Este proyecto pertenece a la **cuenta del Anfiteatro de Villa** (cliente). Las reglas
estan en `C:\Users\Picado\Anfiteatro\CLAUDE.md` (carpeta padre).

- GitHub: `anfiteatrodevillacr/anfiteatro-reviews`
- Vercel: team Anfiteatro
- Supabase: organizacion Anfiteatro
- Drive: carpeta dedicada `ANFITEATRO_DRIVE_ID` (transferida a `anfiteatrodevillacr@gmail.com`)

## Estructura

```
centro-resenas/
├── pages/                   # Next.js pages router
│   ├── index.tsx            # /            (Cavernas)
│   ├── restaurante.tsx
│   ├── evento.tsx
│   ├── servicio.tsx
│   ├── dashboard.tsx        # /dashboard   (panel equipo)
│   ├── menu.tsx             # /menu        (indice interno)
│   └── api/
│       ├── resenas.ts               POST  /api/resenas
│       ├── metricas.ts              GET   /api/metricas
│       ├── codigos/canjear.ts       POST  /api/codigos/canjear
│       └── cron/exportar-drive.ts   POST  /api/cron/exportar-drive (Vercel Cron)
├── components/              # UI compartidos
├── lib/                     # supabase, codigos, copy, validators
├── supabase/
│   ├── migrations/          # 0001_schema_inicial.sql, 0002_rpcs_dashboard.sql
│   └── seed/                # (vacio - los saloneros vienen en 0001)
├── scripts/
│   └── exportar-drive.mjs   # upload CSV a Google Drive
├── docs/                    # arquitectura, TORRE, handoffs
└── .env.local.example
```

## Documentacion

- [Arquitectura](docs/ARQUITECTURA.md)
- [Protocolo TORRE](docs/PROTOCOLO_TORRE.md)
- [Deploy paso a paso](docs/DEPLOY.md)
- [Handoff de continuidad](docs/HANDOFF.md)

## Estado

v2.0.0 — proyecto standalone Next.js + Supabase. Reemplaza el HTML estatico anterior.