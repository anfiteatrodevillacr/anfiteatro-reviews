# Arquitectura — Centro de Reseñas del Anfiteatro

## Diagrama

```
┌──────────────────────────────────────────────────────────────────────┐
│  CLIENTE (visitante del Anfiteatro)                                  │
│  Abre desde QR, link del salonero, o del dashboard del equipo        │
└──────────────┬───────────────────────────────────────────────────────┘
               │ https://anfiteatro-reviews-eight.vercel.app
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  VERCEL — Next.js 14 (pages router)                                  │
│  Pages: / · /restaurante · /evento · /servicio · /menu · /dashboard │
│  APIs:  /api/resenas · /api/metricas · /api/codigos/canjear         │
│         /api/cron/exportar-drive (Vercel Cron diario 6 AM)           │
└──────┬─────────────────────────────────┬─────────────────────────────┘
       │ anon key                       │ service_role (APIs only)
       ▼                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│  SUPABASE — proyecto separado del ERP                                │
│  Tablas: resenas · codigos_cortesia · saloneros · eventos_metricas   │
│  Vistas:  v_resumen_canal · v_resumen_salonero                       │
│  RPCs:    crear_resena_con_cortesia() · canjear_codigo()             │
│  RLS:     anon solo INSERT resenas + SELECT destino=publica          │
└──────────────────────────────────────────────────────────────────────┘
       │ 6 AM diario
       ▼ Vercel Cron → script
┌──────────────────────────────────────────────────────────────────────┐
│  GOOGLE DRIVE — carpeta del Anfiteatro (anfiteatrodevillacr)         │
│  Recibe CSV semanal con todas las resenas.                           │
└──────────────────────────────────────────────────────────────────────┘
```

## Flujos clave

### Cliente deja resena (anon, publica o privada)
1. Cliente abre `/restaurante?salonero=Luis`
2. Completa formulario (estrellas servicio + comida + comentario)
3. POST `/api/resenas` → llama RPC `crear_resena_con_cortesia(canal='restaurante', destino='privada', ...)`
4. La RPC hace INSERT en `resenas` + INSERT en `codigos_cortesia` en una sola transaccion
5. Devuelve `{ resena_id, codigo }` al cliente
6. Cliente ve el codigo de postre y lo copia

### Operador canjea codigo (dashboard, autenticado via env)
1. Operador abre `/dashboard`, tab "Codigos"
2. Pega `REST-AB12-CD34`
3. POST `/api/codigos/canjear` → RPC `canjear_codigo()` cambia estado a 'canjeado'
4. Dashboard actualiza metricas (Promedio de canjes etc)

### Export diario a Drive (cron)
1. Vercel Cron ejecuta `/api/cron/exportar-drive` a las 6 AM
2. RPC lee ultimas 5000 resenas, arma CSV
3. Subir a carpeta del Anfiteatro en Drive (via service account o token)
4. Por ahora es un stub - ver scripts/exportar-drive.mjs para hacerlo manual con OAuth

## Decisiones clave

- **Supabase separado del ERP**: las resenas son datos publicos del cliente final. No se mezclan con datos internos del ERP (CRM, pagos, reservas). Si en algun punto se quieren unificar, un script de migracion lo permite.
- **RLS estricto**: anon solo puede INSERT resenas. SELECT solo si destino='publica' (no ve las privadas). El dashboard usa service_role que bypasea RLS.
- **Codigos de cortesia generados server-side**: `lib/codigos.ts` usa `CORTESIA_SECRET` + timestamp + random, hash SHA-256 → 8 chars en base64url. Imposible de predecir desde el cliente.
- **?salonero=**: la pagina `/restaurante` lee el query param y lo pasa al API. El API lo convierte en `salonero_id` via lookup en la tabla `saloneros`. Los codigos de postre quedan vinculados al salonero, lo que permite el reporte "que salonero genera mas resenas".
- **Cron diario**: 6 AM hora de Costa Rica (`America/Costa_Rica`). Vercel cobra por ejecucion pero los cron son gratis en plan hobby.

## Limitaciones conocidas

- El export a Drive requiere wire-up adicional (OAuth + service account). El endpoint `/api/cron/exportar-drive` ya existe, solo falta subir el archivo via `googleapis`. Esta documentado como TODO en el codigo.
- El dashboard no tiene autenticacion propia. Se asume que el equipo del Anfiteatro usa una VPN o URL no-listada. Agregar Supabase Auth es trivial pero fuera del alcance de esta primera version.