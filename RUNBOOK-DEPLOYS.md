# Runbook — los deployments y a dónde apuntan los QR

## El estado

Hay **tres** deployments vivos de este sitio y sólo uno sirve la versión actual.
Verificado 2026-08-18 comparando el `index.html` servido contra el historial:

| URL | Sirve | Commit |
|---|---|---|
| `anfiteatro-reviews-rho.vercel.app` | ✅ versión Supabase | `5b1ec2e` (main) |
| `anfiteatro-reviews-eight.vercel.app` | ❌ versión pre-migración | `d52afe4` |
| `anfiteatro-reviews.vercel.app` | ❌ aún más vieja | no está en el historial reciente |

Los dos últimos hablan con el Apps Script, **caído desde el 26-jun**. Quien entra
por ahí llena la encuesta, ve la pantalla de gracias, y no se guarda nada.

`-eight` era la URL canónica antes de la migración —estaba en el README y en el
Centro de Comando— así que **los QR impresos que hoy están en las mesas
probablemente apuntan ahí**. Encaja con que Supabase lleve cero eventos desde el
16-ago.

---

## Qué hacer: REDEPLOYAR, no borrar

> ### ⚠️ No borres esos proyectos de Vercel
>
> Es el movimiento intuitivo y es el equivocado. Borrar el proyecto libera el
> hostname y `anfiteatro-reviews-eight.vercel.app` deja de resolver. **Todos los
> QR impresos pasarían de "guarda mal" a "no abre nada".** Eso sí obliga a
> reimprimir y a que el personal cambie los códigos de las mesas.
>
> El hostname hay que **conservarlo y curarlo**, no eliminarlo.

En Vercel, con la cuenta del Anfiteatro:

1. Abrir el proyecto que sirve `anfiteatro-reviews-eight`.
2. **Settings → Git**: reconectar el repo `anfiteatrodevillacr/anfiteatro-reviews`
   si la integración está desconectada. Ese es el motivo de que quedara clavado
   en `d52afe4`.
3. **Deployments → Redeploy** desde `main` (o esperar al push siguiente).
4. Repetir con el proyecto que sirve el dominio pelado.

Con eso los QR impresos empiezan a funcionar **sin reimprimir nada y sin que el
personal haga nada**. Los dos proyectos quedan auto-desplegando desde `main`, así
que se mantienen solos.

### El contrato de los QR no cambió

Verificado entre `d52afe4` y `main`: las dos versiones de `restaurante.html` leen
los mismos parámetros (`mesero`, `salonero`, `server`) y el dashboard sigue
escribiendo `?mesero=`. **Un QR impreso con `?mesero=Ana` sigue atribuyendo a Ana
en la versión nueva.** No se pierde nada al redeployar.

### Verificar que quedó

```bash
for u in https://anfiteatro-reviews-rho.vercel.app \
         https://anfiteatro-reviews-eight.vercel.app \
         https://anfiteatro-reviews.vercel.app; do
  printf '%-45s ' "$u"
  curl -sSL --max-time 30 "$u/" | grep -q 'script.google.com' \
    && echo 'ROJO — todavia Apps Script' \
    || echo 'OK — Supabase'
done
```

El workflow `salud-resenas.yml` del repo `anfiteatro-erp` corre esto mismo a
diario y queda en rojo hasta que los tres estén sanos.

---

## El arreglo de fondo: un dominio propio

Mientras los QR apunten a un `*.vercel.app`, esto puede repetirse: esos hostnames
los genera Vercel, no el negocio, y el sufijo (`-eight`, `-rho`) sale de una
colisión de nombres. **Un QR impreso no debería depender de un hostname que
genera la infraestructura.**

Lo correcto es un subdominio propio —por ejemplo `resenas.anfiteatrodevilla.cr`—
apuntando al proyecto bueno. A partir de ahí los deployments pueden cambiar,
migrarse o renombrarse las veces que sea: los QR impresos siguen sirviendo.

Cuando exista, el cambio en el código es **una línea**: la constante
`CANONICAL_ORIGIN` en `dashboard.html`. El monitor lee esa constante del sitio
desplegado y verifica el destino nuevo automáticamente, sin tocar el workflow.

⚠️ Cambiar `CANONICAL_ORIGIN` sólo afecta a los QR que se impriman **después**.
Los ya pegados en las mesas siguen apuntando a donde apuntaban: por eso el
hostname viejo hay que conservarlo vivo y sano, no retirarlo.
