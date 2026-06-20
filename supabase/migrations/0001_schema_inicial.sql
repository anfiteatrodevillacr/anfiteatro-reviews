-- ─────────────────────────────────────────────────────────────────
-- Migration 0001 — schema inicial del Centro de Resenas
-- Proyecto Supabase DEDICADO (no se mezcla con el ERP).
-- ─────────────────────────────────────────────────────────────────

-- ────────────── Enums ──────────────

create type resena_canal as enum (
  'cavernas',
  'restaurante',
  'evento',
  'servicio'
);

create type resena_destino as enum (
  'publica',
  'privada'
);

create type codigo_tipo as enum (
  'descuento_cavernas',
  'postre_cortesia',
  'tour_cortesia'
);

create type codigo_estado as enum (
  'activo',
  'canjeado',
  'expirado'
);

-- ────────────── Tabla: resenas ──────────────

create table public.resenas (
  id                    uuid primary key default gen_random_uuid(),
  canal                 resena_canal not null,
  destino               resena_destino not null,
  estrellas             smallint not null check (estrellas between 1 and 5),
  estrellas_servicio    smallint,
  estrellas_comida      smallint,
  resolvio              boolean,
  comentario            text,
  salonero_id           uuid,
  idioma                text not null default 'es',
  user_agent            text,
  ip_origen             inet,
  created_at            timestamptz not null default now()
);

create index resenas_canal_created_idx on public.resenas (canal, created_at desc);
create index resenas_destino_idx       on public.resenas (destino);
create index resenas_salonero_idx      on public.resenas (salonero_id);

-- ────────────── Tabla: codigos_cortesia ──────────────

create table public.codigos_cortesia (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,
  tipo            codigo_tipo not null,
  estado          codigo_estado not null default 'activo',
  resena_id       uuid references public.resenas(id) on delete set null,
  salonero_id     uuid,
  emitido_at      timestamptz not null default now(),
  expira_at       timestamptz,
  canjeado_at     timestamptz,
  canjeado_por    text,
  notas           text
);

create index codigos_estado_idx on public.codigos_cortesia (estado);
create index codigos_tipo_idx   on public.codigos_cortesia (tipo);
create index codigos_codigo_idx on public.codigos_cortesia (codigo);

-- ────────────── Tabla: saloneros ──────────────

create table public.saloneros (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  slug        text not null unique,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index saloneros_activo_idx on public.saloneros (activo);

-- ────────────── Tabla: eventos_metricas ──────────────

create table public.eventos_metricas (
  id          bigserial primary key,
  tipo        text not null,
  canal       resena_canal,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index eventos_tipo_created_idx on public.eventos_metricas (tipo, created_at desc);

-- ────────────── Vistas para el dashboard ──────────────

create or replace view public.v_resumen_canal as
  select
    canal,
    count(*)                                                  as total,
    avg(estrellas)::numeric(3,2)                              as promedio_estrellas,
    count(*) filter (where destino = 'publica')               as publicas,
    count(*) filter (where destino = 'privada')               as privadas,
    count(*) filter (where created_at > now() - interval '7 days')   as ultima_semana,
    count(*) filter (where created_at > now() - interval '30 days')  as ultimo_mes
  from public.resenas
  group by canal;

create or replace view public.v_resumen_salonero as
  select
    s.id,
    s.nombre,
    s.slug,
    count(r.id)                                    as resenas,
    avg(r.estrellas)::numeric(3,2)                 as promedio_estrellas,
    max(r.created_at)                              as ultima_resena
  from public.saloneros s
  left join public.resenas r on r.salonero_id = s.id
  where s.activo = true
  group by s.id, s.nombre, s.slug;

-- ────────────── RLS ──────────────

alter table public.resenas           enable row level security;
alter table public.codigos_cortesia  enable row level security;
alter table public.saloneros         enable row level security;
alter table public.eventos_metricas  enable row level security;

create policy "anon insert resena" on public.resenas
  for insert to anon with check (true);

create policy "anon select publicas" on public.resenas
  for select to anon using (destino = 'publica');

-- ────────────── Seed: saloneros iniciales ──────────────

insert into public.saloneros (nombre, slug) values
  ('Carlos',  'carlos'),
  ('María',   'maria'),
  ('Luis',    'luis'),
  ('Ana',     'ana'),
  ('Equipo',  'equipo')
on conflict (slug) do nothing;
