-- ══════════════════════════════════════════════════════════════════════════
-- Backend de Reseñas del Anfiteatro — Supabase (base PRIMARIA)
-- Proyecto: synmmfoiyzkdnyfaddpo (org "ADV ERP")
-- ══════════════════════════════════════════════════════════════════════════
--
-- CONTEXTO: migración desde Google Apps Script + Sheets (2026-08-16). Supabase
-- es ahora la base primaria; Google Sheets/Drive quedan como respaldo.
-- El esquema de tablas (resenas, codigos_cortesia, eventos_metricas, saloneros,
-- keepalive, vista v_resumen_canal) ya existía de la v2 y se reutiliza.
--
-- Este archivo documenta y VERSIONA las funciones RPC (la lógica de negocio,
-- incluida la de DINERO). Es idempotente: se puede re-aplicar.
--
-- PATRÓN DE SEGURIDAD: el rol anónimo (publishable key) NO hace INSERT/UPDATE
-- directo (RLS lo bloquea). Toda escritura pasa por estas funciones
-- SECURITY DEFINER con search_path fijo, que validan internamente.
-- ══════════════════════════════════════════════════════════════════════════

-- ── Registrar evento de métrica (visits, clicks a Google/TripAdvisor, gates) ──
create or replace function public.registrar_evento(
  p_tipo text,
  p_canal text default null,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = public as $func$
begin
  insert into public.eventos_metricas (tipo, canal, metadata)
  values (p_tipo, nullif(p_canal,'')::resena_canal, coalesce(p_metadata, '{}'::jsonb));
end $func$;
revoke all on function public.registrar_evento(text,text,jsonb) from public;
grant execute on function public.registrar_evento(text,text,jsonb) to anon, authenticated;

-- ── Crear reseña (pública o privada) + código de cortesía opcional ──
-- Reemplaza handleRestaurantReview/handleEventReview/handleServiceReview +
-- recordFeedback + saveCode del Apps Script viejo.
-- FIX 2026-08-16: se agregó `#variable_conflict use_column` y search_path;
-- la v2 tenía un choque de nombres ("codigo" ambiguo) que rompía la generación
-- de código. Verificado end-to-end.
create or replace function public.crear_resena_con_cortesia(
  p_canal resena_canal, p_destino resena_destino, p_estrellas smallint,
  p_estrellas_servicio smallint default null, p_estrellas_comida smallint default null,
  p_resolvio boolean default null, p_comentario text default null,
  p_salonero_slug text default null, p_idioma text default 'es',
  p_user_agent text default null, p_ip_origen inet default null,
  p_cortesia_tipo codigo_tipo default null, p_cortesia_codigo text default null)
returns table(resena_id uuid, codigo_id uuid, codigo text)
language plpgsql security definer set search_path = public
as $func$
#variable_conflict use_column
declare v_resena_id uuid; v_salonero_id uuid; v_codigo_id uuid;
begin
  if p_salonero_slug is not null then
    select id into v_salonero_id from public.saloneros where slug = p_salonero_slug and activo = true;
  end if;
  insert into public.resenas (canal, destino, estrellas, estrellas_servicio, estrellas_comida, resolvio, comentario, salonero_id, idioma, user_agent, ip_origen)
  values (p_canal, p_destino, p_estrellas, p_estrellas_servicio, p_estrellas_comida, p_resolvio, p_comentario, v_salonero_id, p_idioma, p_user_agent, p_ip_origen)
  returning id into v_resena_id;
  insert into public.eventos_metricas (tipo, canal, metadata)
  values ('resena_enviada', p_canal, jsonb_build_object('resena_id', v_resena_id, 'destino', p_destino));
  if p_cortesia_tipo is not null and p_cortesia_codigo is not null then
    insert into public.codigos_cortesia (codigo, tipo, resena_id, salonero_id)
    values (p_cortesia_codigo, p_cortesia_tipo, v_resena_id, v_salonero_id)
    on conflict (codigo) do nothing returning id into v_codigo_id;
  end if;
  return query select v_resena_id, v_codigo_id, p_cortesia_codigo;
end $func$;
revoke all on function public.crear_resena_con_cortesia(resena_canal,resena_destino,smallint,smallint,smallint,boolean,text,text,text,text,inet,codigo_tipo,text) from public;
grant execute on function public.crear_resena_con_cortesia(resena_canal,resena_destino,smallint,smallint,smallint,boolean,text,text,text,text,inet,codigo_tipo,text) to anon, authenticated;

-- ── Guardar un código de cortesía suelto (sin reseña propia) ──
-- Para review.html: el cliente hace click a Google/TripAdvisor (deja la reseña
-- allá, no en nuestra DB) y recibe un código. resena_id queda NULL.
alter table public.codigos_cortesia alter column resena_id drop not null;
create or replace function public.guardar_codigo(p_codigo text, p_tipo codigo_tipo)
returns text language plpgsql security definer set search_path = public as $g$
begin
  insert into public.codigos_cortesia (codigo, tipo) values (p_codigo, p_tipo)
  on conflict (codigo) do nothing;
  return p_codigo;
end $g$;
revoke all on function public.guardar_codigo(text,codigo_tipo) from public;
grant execute on function public.guardar_codigo(text,codigo_tipo) to anon, authenticated;

-- ── Canjear código (marca 'canjeado', previene doble uso) — lógica de DINERO ──
-- FIX 2026-08-16: mismo choque de nombres ("tipo" ambiguo) corregido.
-- Verificado: canje OK, doble-canje rechazado, código inexistente rechazado.
create or replace function public.canjear_codigo(p_codigo text, p_canjeado_por text default null, p_notas text default null)
returns table(ok boolean, mensaje text, tipo codigo_tipo, resena_id uuid)
language plpgsql security definer set search_path = public
as $func$
#variable_conflict use_column
declare v_id uuid; v_tipo codigo_tipo; v_estado codigo_estado;
begin
  select id, tipo, estado into v_id, v_tipo, v_estado from public.codigos_cortesia where codigo = p_codigo for update;
  if v_id is null then return query select false, 'Codigo no encontrado'::text, null::codigo_tipo, null::uuid; return; end if;
  if v_estado = 'canjeado' then return query select false, 'Codigo ya fue canjeado'::text, v_tipo, null::uuid; return; end if;
  if v_estado = 'expirado' then return query select false, 'Codigo expirado'::text, v_tipo, null::uuid; return; end if;
  update public.codigos_cortesia set estado='canjeado', canjeado_at=now(), canjeado_por=coalesce(p_canjeado_por, canjeado_por), notas=coalesce(p_notas, notas) where id = v_id;
  insert into public.eventos_metricas (tipo, metadata) values ('codigo_canjeado', jsonb_build_object('codigo_id', v_id, 'tipo', v_tipo));
  return query select true, 'Codigo canjeado OK'::text, v_tipo, (select resena_id from public.codigos_cortesia where id = v_id);
end $func$;
revoke all on function public.canjear_codigo(text,text,text) from public;
grant execute on function public.canjear_codigo(text,text,text) to anon, authenticated;

-- keepalive_ping() ya existe de la v2 (SECURITY DEFINER, anon EXECUTE). Toca la
-- tabla keepalive → cuenta como actividad para que el Free plan no pause.

-- ══════════════════════════════════════════════════════════════════════════
-- DASHBOARD (panel admin) — funciones de lectura + config + meseros
-- ══════════════════════════════════════════════════════════════════════════

-- Tabla de config de cortesías (costos/límites por categoría)
create table if not exists public.config_cortesias (
  categoria text primary key, cost numeric not null default 0, lim numeric, actualizado timestamptz default now()
);
alter table public.config_cortesias enable row level security;
drop policy if exists cfg_anon_read on public.config_cortesias;
create policy cfg_anon_read on public.config_cortesias for select to anon using (true);
insert into public.config_cortesias(categoria,cost,lim) values
  ('anfi15',6,null),('postre',3,null),('tour',15,null) on conflict do nothing;

-- codigos_cortesia.emitido_at con default (para agregaciones del mes)
alter table public.codigos_cortesia alter column emitido_at set default now();

-- registrar/actualizar mesero (salonero). FIX use_column (choque "slug").
create or replace function public.registrar_salonero(p_slug text, p_nombre text)
returns table(id uuid, slug text, nombre text) language plpgsql security definer set search_path=public as $f$
#variable_conflict use_column
begin
  return query insert into public.saloneros(slug,nombre,activo)
    values (lower(trim(p_slug)), trim(p_nombre), true)
    on conflict (slug) do update set nombre=excluded.nombre
    returning saloneros.id, saloneros.slug, saloneros.nombre;
end $f$;
revoke all on function public.registrar_salonero(text,text) from public;
grant execute on function public.registrar_salonero(text,text) to anon, authenticated;

-- guardar config de cortesías
create or replace function public.set_config_cortesias(p_config jsonb)
returns jsonb language plpgsql security definer set search_path=public as $f$
declare k text;
begin
  for k in select jsonb_object_keys(p_config) loop
    insert into public.config_cortesias(categoria,cost,lim,actualizado)
    values (k, coalesce((p_config->k->>'cost')::numeric,0), nullif(p_config->k->>'limit','')::numeric, now())
    on conflict (categoria) do update set cost=excluded.cost, lim=excluded.lim, actualizado=now();
  end loop;
  return (select jsonb_object_agg(categoria, jsonb_build_object('cost',cost,'limit',lim)) from public.config_cortesias);
end $f$;
revoke all on function public.set_config_cortesias(jsonb) from public;
grant execute on function public.set_config_cortesias(jsonb) to anon, authenticated;

-- dashboard_stats(): MISMO formato que getStats del Apps Script viejo.
-- Definición aplicada en la DB (ver historial). Devuelve jsonb con gate_yes/gate_no/
-- visits/google/ta/last_event/feedback[]/restaurante[]/evento[]/servicio[]/
-- courtesy_config/courtesy_summary/meseros[]. grant a anon, authenticated.

-- dashboard_analytics(): today/week/month + daily[14] de eventos. grant a anon, authenticated.
-- (Cuerpos completos de ambas en la DB; son de lectura/agregación pura.)
