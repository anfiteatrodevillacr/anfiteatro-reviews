-- ─────────────────────────────────────────────────────────────────
-- Migration 0002 — RPCs y helpers para el dashboard
-- ─────────────────────────────────────────────────────────────────

-- Canjear un codigo de cortesia (operador del equipo)
create or replace function public.canjear_codigo(
  p_codigo        text,
  p_canjeado_por  text default null,
  p_notas         text default null
)
returns table (
  ok              boolean,
  mensaje         text,
  tipo            codigo_tipo,
  resena_id       uuid
)
language plpgsql
security definer
as $$
declare
  v_id      uuid;
  v_tipo    codigo_tipo;
  v_estado  codigo_estado;
begin
  select id, tipo, estado into v_id, v_tipo, v_estado
  from public.codigos_cortesia
  where codigo = p_codigo
  for update;

  if v_id is null then
    return query select false, 'Codigo no encontrado'::text, null::codigo_tipo, null::uuid;
    return;
  end if;

  if v_estado = 'canjeado' then
    return query select false, 'Codigo ya fue canjeado'::text, v_tipo, null::uuid;
    return;
  end if;

  if v_estado = 'expirado' then
    return query select false, 'Codigo expirado'::text, v_tipo, null::uuid;
    return;
  end if;

  update public.codigos_cortesia
  set estado       = 'canjeado',
      canjeado_at  = now(),
      canjeado_por = coalesce(p_canjeado_por, canjeado_por),
      notas        = coalesce(p_notas, notas)
  where id = v_id;

  insert into public.eventos_metricas (tipo, metadata)
  values ('codigo_canjeado', jsonb_build_object('codigo_id', v_id, 'tipo', v_tipo));

  return query select true, 'Codigo canjeado OK'::text, v_tipo, (
    select resena_id from public.codigos_cortesia where id = v_id
  );
end;
$$;

-- Insertar una resena y devolver un codigo generado (si corresponde).
-- Esta funcion la llama el API route. Hace las dos cosas en una transaccion.

create or replace function public.crear_resena_con_cortesia(
  p_canal              resena_canal,
  p_destino            resena_destino,
  p_estrellas          smallint,
  p_estrellas_servicio smallint default null,
  p_estrellas_comida   smallint default null,
  p_resolvio           boolean  default null,
  p_comentario         text     default null,
  p_salonero_slug      text     default null,
  p_idioma             text     default 'es',
  p_user_agent         text     default null,
  p_ip_origen          inet     default null,
  p_cortesia_tipo      codigo_tipo default null,
  p_cortesia_codigo    text     default null
)
returns table (
  resena_id   uuid,
  codigo_id   uuid,
  codigo      text
)
language plpgsql
security definer
as $$
declare
  v_resena_id      uuid;
  v_salonero_id    uuid;
  v_codigo_id      uuid;
begin
  -- resolver salonero_id si paso slug
  if p_salonero_slug is not null then
    select id into v_salonero_id from public.saloneros where slug = p_salonero_slug and activo = true;
  end if;

  insert into public.resenas (
    canal, destino, estrellas, estrellas_servicio, estrellas_comida,
    resolvio, comentario, salonero_id, idioma, user_agent, ip_origen
  ) values (
    p_canal, p_destino, p_estrellas, p_estrellas_servicio, p_estrellas_comida,
    p_resolvio, p_comentario, v_salonero_id, p_idioma, p_user_agent, p_ip_origen
  )
  returning id into v_resena_id;

  insert into public.eventos_metricas (tipo, canal, metadata)
  values ('resena_enviada', p_canal, jsonb_build_object('resena_id', v_resena_id, 'destino', p_destino));

  -- generar codigo de cortesia si aplica
  if p_cortesia_tipo is not null and p_cortesia_codigo is not null then
    insert into public.codigos_cortesia (codigo, tipo, resena_id, salonero_id)
    values (p_cortesia_codigo, p_cortesia_tipo, v_resena_id, v_salonero_id)
    on conflict (codigo) do nothing
    returning id into v_codigo_id;
  end if;

  return query select v_resena_id, v_codigo_id, p_cortesia_codigo;
end;
$$;

-- Otorgar permiso de ejecucion a anon (la API lo llama con anon key)
grant execute on function public.crear_resena_con_cortesia to anon;
grant execute on function public.canjear_codigo             to anon;