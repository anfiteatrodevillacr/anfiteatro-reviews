-- ─────────────────────────────────────────────────────────────────
-- Migration 0001 — schema inicial del Centro de Resenas
-- Vive en el MISMO proyecto Supabase que el ERP Anfiteatro,
-- pero en un schema AISLADO (centro_resenas) para no chocar con
-- las tablas public.* del ERP (clientes, reservas, etc.).
--
-- Las tablas quedan como: centro_resenas.resenas, centro_resenas.codigos_cortesia, etc.
-- Las APIs usan el mismo SUPABASE_URL/ANON/SERVICE_ROLE que el ERP,
-- pero las queries referencian centro_resenas.tabla.
-- ─────────────────────────────────────────────────────────────────

-- ────────────── Crear schema si no existe ──────────────

create schema if not exists centro_resenas;

-- ────────────── Enums (dentro del schema) ──────────────

create type centro_resenas.resena_canal as enum (
  'cavernas',
  'restaurante',
  'evento',
  'servicio'
);

create type centro_resenas.resena_destino as enum (
  'publica',          -- redirigida a Google/TripAdvisor
  'privada'           -- feedback interno, no se publica
);

create type centro_resenas.codigo_tipo as enum (
  'descuento_cavernas',     -- 10% descuento en proxima visita
  'postre_cortesia',        -- postre gratis en restaurante
  'tour_cortesia'           -- tour gratis para 1 persona
);

create type centro_resenas.codigo_estado as enum (
  'activo',
  'canjeado',
  'expirado'
);

-- ────────────── Tabla: resenas ──────────────

create table centro_resenas.resenas (
  id              uuid primary key default gen_random_uuid(),
  canal           centro_resenas.resena_canal not null,
  destino         centro_resenas.resena_destino not null,
  estrellas       smallint not null check (estrellas between 1 and 5),
  -- restaurante: estrellas_servicio + estrellas_comida
  estrellas_servicio  smallint,
  estrellas_comida    smallint,
  -- servicio: si/no
  resolvio       boolean,
  comentario      text,
  -- trazabilidad
  salonero_id     uuid,                  -- si aplica (?salonero= en restaurante)
  idioma          text not null default 'es',
  user_agent      text,
  ip_origen       inet,
  created_at      timestamptz not null default now()
);

create index resenas_canal_created_idx on centro_resenas.resenas (canal, created_at desc);
create index resenas_destino_idx       on centro_resenas.resenas (destino);
create index resenas_salonero_idx      on centro_resenas.resenas (salonero_id);

-- ────────────── Tabla: codigos_cortesia ──────────────

create table centro_resenas.codigos_cortesia (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,
  tipo            centro_resenas.codigo_tipo not null,
  estado          centro_resenas.codigo_estado not null default 'activo',
  resena_id       uuid references centro_resenas.resenas(id) on delete set null,
  salonero_id     uuid,
  emitido_at      timestamptz not null default now(),
  expira_at       timestamptz,           -- null = no expira
  canjeado_at     timestamptz,
  canjeado_por    text,                  -- nombre del operador que lo canjea
  notas           text
);

create index codigos_estado_idx    on centro_resenas.codigos_cortesia (estado);
create index codigos_tipo_idx      on centro_resenas.codigos_cortesia (tipo);
create index codigos_codigo_idx    on centro_resenas.codigos_cortesia (codigo);

-- ────────────── Tabla: saloneros ──────────────

create table centro_resenas.saloneros (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  slug            text not null unique,        -- el mismo que va en ?salonero=
  activo          boolean not null default true,
  created_at      timestamptz not null default now()
);

create index saloneros_activo_idx on centro_resenas.saloneros (activo);

-- ────────────── Tabla: eventos_metricas ──────────────
-- Tabla append-only de eventos del dashboard (vistas, envios, canjes).
-- Alimenta el panel interno.

create table centro_resenas.eventos_metricas (
  id              bigserial primary key,
  tipo            text not null,              -- 'pagina_vista' | 'resena_enviada' | 'codigo_canjeado' | etc
  canal           centro_resenas.resena_canal,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index eventos_tipo_created_idx on centro_resenas.eventos_metricas (tipo, created_at desc);

-- ────────────── Vistas para el dashboard ──────────────

create or replace view centro_resenas.v_resumen_canal as
  select
    canal,
    count(*)                                                  as total,
    avg(estrellas)::numeric(3,2)                              as promedio_estrellas,
    count(*) filter (where destino = 'publica')               as publicas,
    count(*) filter (where destino = 'privada')               as privadas,
    count(*) filter (where created_at > now() - interval '7 days')   as ultima_semana,
    count(*) filter (where created_at > now() - interval '30 days')  as ultimo_mes
  from centro_resenas.resenas
  group by canal;

create or replace view centro_resenas.v_resumen_salonero as
  select
    s.id,
    s.nombre,
    s.slug,
    count(r.id)                                    as resenas,
    avg(r.estrellas)::numeric(3,2)                 as promedio_estrellas,
    max(r.created_at)                              as ultima_resena
  from centro_resenas.saloneros s
  left join centro_resenas.resenas r on r.salonero_id = s.id
  where s.activo = true
  group by s.id, s.nombre, s.slug;

-- ────────────── RLS ──────────────
-- Politica: cliente anon solo puede INSERT resenas (no SELECT de las privadas).
-- service_role (usado en APIs del dashboard) bypasea RLS.

alter table centro_resenas.resenas           enable row level security;
alter table centro_resenas.codigos_cortesia  enable row level security;
alter table centro_resenas.saloneros         enable row level security;
alter table centro_resenas.eventos_metricas  enable row level security;

-- resenas: INSERT anon si, SELECT publico solo si destino='publica'
create policy "anon insert resena" on centro_resenas.resenas
  for insert to anon with check (true);

create policy "anon select publicas" on centro_resenas.resenas
  for select to anon using (destino = 'publica');

-- codigos_cortesia: anon no ve nada (los ve el operador en el dashboard)
-- saloneros: anon no ve nada
-- eventos_metricas: anon no ve nada

-- service_role bypasea RLS automaticamente (no hace falta policy explicita)

-- ────────────── Seed: saloneros iniciales ──────────────

insert into centro_resenas.saloneros (nombre, slug) values
  ('Carlos',  'carlos'),
  ('María',   'maria'),
  ('Luis',    'luis'),
  ('Ana',     'ana'),
  ('Equipo',  'equipo')          -- fallback cuando no se pasa ?salonero=
on conflict (slug) do nothing;
