# Anfiteatro Reviews — Centro de Reseñas

Sistema de reseñas del Anfiteatro de Villa, Ciudad Colón, Costa Rica.

**HTML estático + Supabase.** Sin framework, sin build: los `.html` se sirven tal
cual desde Vercel y hablan con Supabase por RPC.

## Producción

| | URL |
|---|---|
| Cliente | https://anfiteatro-reviews-rho.vercel.app |
| Dashboard del equipo | https://anfiteatro-reviews-rho.vercel.app/dashboard |
| Índice interno | https://anfiteatro-reviews-rho.vercel.app/menu |

> ⚠️ **Existen otros dos hosts viejos y NO se usan.**
> `anfiteatro-reviews-eight.vercel.app` redirige (307) al bueno conservando ruta y
> parámetros. `anfiteatro-reviews.vercel.app` quedó abandonado: sirve una versión
> de junio de 2026 contra un backend que ya no existe. **La URL válida es `-rho`.**

## Pantallas

| Ruta | Para | Función |
|---|---|---|
| `/` | cliente tour | Filtro Sí/No; redirige a Google o TripAdvisor; si No, da 10% de descuento |
| `/restaurante` | cliente restaurante | Estrellas servicio + comida; postre de cortesía. Acepta `?mesero=`, `?salonero=` o `?server=` |
| `/evento` | cliente evento | Estrellas experiencia + servicio; tour de cortesía |
| `/servicio` | cliente atención | Estrella + resolvió sí/no; feedback interno sin código |
| `/menu` | equipo | Índice con links a todas las pantallas |
| `/dashboard` | equipo | Métricas, feedback privado, canje de códigos, meseros y **códigos QR** |

## Backend

Supabase, proyecto `synmmfoiyzkdnyfaddpo` (organización Anfiteatro). Todo pasa por
RPCs `security definer` que `anon` puede ejecutar — el navegador nunca escribe
directo en una tabla:

`registrar_evento` · `crear_resena_con_cortesia` · `guardar_codigo` ·
`canjear_codigo` · `registrar_salonero` · `set_config_cortesias` ·
`dashboard_stats` · `dashboard_analytics`

La `publishable key` que viaja en el JS es pública por diseño; lo que protege la
base son las policies de RLS y que la escritura sólo ocurra por esas funciones.

## Códigos QR — se bajan del dashboard

**No imprimas QR de archivos sueltos.** El dashboard genera los de las cuatro
pantallas (tour, restaurante por mesero, evento y atención) con botón de descarga.

Todos se arman desde la constante `CANONICAL_ORIGIN` en `dashboard.html`, **no**
desde `window.location.origin`. Es a propósito y es importante: un QR impreso vive
meses pegado en una mesa, y con `location.origin` quedaba amarrado al host donde
estaba abierto el dashboard. Así se perdieron reseñas cuando cambió la URL.

Si algún día se pone un dominio propio, se cambia esa constante y listo.

## Monitoreo

Dos workflows en el repo `anfiteatrodevillacr/anfiteatro-erp`:

- **`keepalive.yml`** — escribe en la base dos veces al día. El plan free de
  Supabase pausa proyectos con poca actividad, y ya pasó dos veces. Falla si el
  ping no dejó rastro del día.
- **`salud-resenas.yml`** — a diario: que `dashboard_stats` responda sano, que los
  hosts sirvan la versión con Supabase, y que **el destino real de los QR** (leído
  del dashboard desplegado) esté vivo.

## Historia

Nació sobre Google Apps Script + Sheets. Ese backend se cayó el 26-jun-2026 y
estuvo **42 días muerto sin que nadie lo notara**: el front mandaba los eventos
con `fetch(..., {mode:'no-cors'})` y no podía ver el error, así que el cliente
llenaba la encuesta, veía la pantalla de gracias, y no se guardaba nada.

El 16-ago-2026 se migró a Supabase. Los ~150 eventos de mayo y junio quedaron sólo
en la hoja de Google y **se dieron por perdidos** por decisión de Kenneth: es
historia, no operación.

## Identidad

Cuentas del cliente: GitHub `anfiteatrodevillacr`, Vercel team Anfiteatro,
Supabase organización Anfiteatro.

> 🔐 La cuenta `anfiteatrodevillacr` bloquea pushes que exponen su correo. Firmá
> con `294580270+anfiteatrodevillacr@users.noreply.github.com`.
