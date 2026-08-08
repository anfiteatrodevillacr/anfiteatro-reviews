# Runbook — backend del Centro de Reseñas

El backend es un **Google Apps Script** que escribe en una hoja de cálculo.
No es Supabase. (El README todavía documenta una v2 Next.js + Supabase que se
revirtió en `b59f6e9` y ya no existe.)

| Pieza | Dónde |
|---|---|
| Web App | `https://script.google.com/macros/s/AKfycbzX_CJ18adp.../exec` |
| Hoja | `Anfiteatro de Villa — Reseñas 📊` · ID `1MMWZg4GNR0Y6C4lYSFZRsnuyKSQ9pqc0RB36uoPsRwc` |
| Código en el repo | `apps-script-extensions.gs` — **sólo un anexo** |
| Código real | `anfi_backend.gs` — ⚠️ **no está en ningún repo, vive sólo en el editor** |

Las 6 páginas del sitio apuntan a esa misma URL.

---

## Diagnóstico rápido

```bash
curl -sSL 'https://script.google.com/macros/s/AKfycbzX_CJ18adp-bHzhXJfFrXr9MIG5WtYVsNSknn_dDUJnkz8WGOoriN7LuEDKUoLbeEQJg/exec?action=stats'
```

| Respuesta | Qué significa |
|---|---|
| JSON con datos | Sano |
| `{"status":"error","message":"TypeError: ... getSheetByName ... null"}` | El script no puede abrir la hoja → ver abajo |
| HTML en vez de JSON | El Web App pide login: *Manage deployments* → **Quién tiene acceso = Cualquiera** |
| No responde | El deployment se borró o cambió de URL |

**La trampa:** llamar la URL **sin** `?action=stats` devuelve
`{"status":"ok","api":"Anfiteatro de Villa v1.2"}` **aunque la hoja esté rota**.
Ese endpoint no toca datos. Un monitor apuntado ahí se ve verde siempre — por
eso el incidente del 26-jun pasó 42 días inadvertido. **Siempre probar con una
acción que toque la hoja.**

---

## Si devuelve el error de `getSheetByName` sobre null

**Causa:** `SpreadsheetApp.getActiveSpreadsheet()` devuelve `null`. Ese método
sólo funciona si el script está **ligado** a su hoja contenedora. Si el script
quedó standalone —o perdió el vínculo— devuelve `null` siempre.

**Arreglo (ya aplicado en `apps-script-extensions.gs`):** abrir la hoja por ID.

1. Abrir el proyecto en el editor de Apps Script.
2. Confirmar si está **bound** o **standalone**: si el editor muestra arriba el
   nombre de la hoja y *Extensiones → Apps Script* lo abre desde la hoja, está
   bound. Si no, es standalone. **Con `openById` deja de importar.**
3. En **`anfi_backend.gs`**, Ctrl+H: reemplazar todas las apariciones de
   `SpreadsheetApp.getActiveSpreadsheet()` por `getSS_()`.
4. Pegar/actualizar `apps-script-extensions.gs`, que es donde queda definido
   `getSS_()` junto con la constante `SHEET_ID`.
5. Verificar que la cuenta del **"Ejecutar como"** del deployment tenga acceso
   a la hoja. Hoy la hoja es de `aquilesmaximus@gmail.com`, no de
   `anfiteatrodevillacr@gmail.com`.
6. **Deploy → Manage deployments → lápiz → New version → Deploy.**
   La URL **no cambia**. (Crear un deployment *nuevo* sí genera otra URL y
   dejaría el sitio apuntando al viejo.)
7. Verificar con el `curl` de arriba.
8. Cargar el sitio y confirmar que aparece una fila `visit` nueva en la hoja.

---

## Al reparar: revisar los códigos repartidos

Los códigos de cortesía **se generan en el navegador**, no en el backend. El
front sólo esconde el código si la respuesta dice `limit_reached`; con
`status:"error"` cae en el `else` y **lo muestra igual**
(`index.html`, `pingCode` → callback).

Con el backend caído eso significa que se repartieron códigos `ANFI10` que:

- nunca se guardaron en la pestaña `Codigos`,
- el dashboard **no puede canjear**,
- **se saltaron el tope mensual** de cortesías (`checkCourtesyLimit_`).

El último código realmente registrado es `ANFI10-EAR3WQ` del **24-jun**.
Cualquier código posterior que traiga un cliente **no va a validar**. Decidir
qué hacer con los que aparezcan.

---

## Deuda conocida

- **`anfi_backend.gs` no está versionado.** Si se pierde la cuenta, se pierde
  el backend. Traerlo al repo es la tarea más urgente después del arreglo.
- **La hoja es de la cuenta personal.** Transferirla a
  `anfiteatrodevillacr@gmail.com` no rompe nada: el ID no cambia al transferir,
  así que `SHEET_ID` sigue sirviendo. Lo que hay que revisar es el acceso de la
  cuenta del "Ejecutar como".
- **Fallo silencioso en el front.** `fetch(..., {mode:'no-cors'})` con
  `.catch(function(){})` vacío no puede detectar nada. La red de seguridad es
  externa: el workflow `salud-resenas.yml` del repo `anfiteatro-erp`, que corre
  a diario y falla si esta URL devuelve `status:"error"`.
