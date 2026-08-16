/* ══════════════════════════════════════════════════════════════════════════
   Adaptador de backend de reseñas — Supabase (base primaria)
   Reemplaza al Apps Script viejo. Expone window.ANFI con las operaciones que
   los HTML usan. La publishable key es pública por diseño (va en el navegador);
   la seguridad la da RLS + funciones SECURITY DEFINER en Supabase.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  var SB_URL = 'https://synmmfoiyzkdnyfaddpo.supabase.co';
  var SB_KEY = 'sb_publishable_2VrcEzLTcLPkh4qDmwgVNQ_elZE_2Oh';

  function rpc(fn, body) {
    return fetch(SB_URL + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); });
  }

  // source (viejo) -> codigo_tipo (Supabase). Espeja COURTESY_SOURCE_TO_CATEGORY.
  var TIPO_BY_SOURCE = {
    google: 'descuento_cavernas', ta: 'descuento_cavernas', tripadvisor: 'descuento_cavernas',
    feedback: 'descuento_cavernas', restaurante: 'postre_cortesia', evento: 'tour_cortesia',
    servicio: 'descuento_cavernas'
  };
  function tipoBySource(s) { return TIPO_BY_SOURCE[s] || 'descuento_cavernas'; }

  window.ANFI = {
    tipoBySource: tipoBySource,

    /* Evento de métrica (fire-and-forget). meta va a jsonb. */
    evento: function (tipo, canal, meta) {
      return rpc('registrar_evento', { p_tipo: tipo, p_canal: canal || null, p_metadata: meta || {} })
        .catch(function () {});
    },

    /* Crea una reseña. o = objeto con las columnas (p_canal, p_destino,
       p_estrellas, ...). Devuelve [{resena_id, codigo_id, codigo}]. */
    resena: function (o) { return rpc('crear_resena_con_cortesia', o); },

    /* Código de cortesía suelto (sin reseña propia; p.ej. click a Google). */
    codigo: function (code, source) {
      return rpc('guardar_codigo', { p_codigo: code, p_tipo: tipoBySource(source) });
    },

    /* Canje de código (para el dashboard/caja). */
    canjear: function (code, por) {
      return rpc('canjear_codigo', { p_codigo: code, p_canjeado_por: por || null });
    }
  };
})();
