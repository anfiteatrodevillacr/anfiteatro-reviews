# Deploy paso a paso

## 1. Crear proyecto Supabase (org del Anfiteatro)

1. Entrar a https://supabase.com logueado como `anfiteatrodevillacr@gmail.com`
2. Crear org "Anfiteatro de Villa" si no existe
3. Crear proyecto `anfiteatro-reviews`
4. Esperar 2 minutos a que el proyecto este listo
5. Ir a SQL Editor y ejecutar en orden:
   - `supabase/migrations/0001_schema_inicial.sql`
   - `supabase/migrations/0002_rpcs_dashboard.sql`
6. Ir a Settings → API y copiar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` (NO exponer al cliente)

## 2. Crear repo GitHub (org del Anfiteatro)

1. Entrar a https://github.com logueado como `anfiteatrodevillacr`
2. Crear repo `anfiteatro-reviews` (public o private, lo que prefieran)
3. Agregar remoto: `git remote add origin git@github.com:anfiteatrodevillacr/anfiteatro-reviews.git`
4. Push inicial

## 3. Conectar Vercel (team del Anfiteatro)

1. Entrar a https://vercel.com con la cuenta del team Anfiteatro
2. Add new project → importar `anfiteatrodevillacr/anfiteatro-reviews`
3. Framework: Next.js
4. Variables de entorno (en Vercel, NO en .env.local):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CORTESIA_SECRET` (un string aleatorio de 32+ chars, ej: `openssl rand -hex 32`)
   - `CRON_SECRET` (otro string aleatorio, lo usa Vercel Cron)
   - `ANFITEATRO_DRIVE_ID` = `1uqUA7UinAOTxxDoX7Rn8r2W3Gw6BysFv` (el ID del Drive que se creo)
   - `NEXT_PUBLIC_GOOGLE_REVIEW_URL` = URL real del Place ID del Anfiteatro
   - `NEXT_PUBLIC_TRIPADVISOR_REVIEW_URL` = URL real de TripAdvisor
5. Deploy

## 4. Configurar cron (Vercel)

Vercel detecta automaticamente el `vercel.json` y agenda el cron. Verificar en:
- Project → Settings → Cron Jobs → debe aparecer `/api/cron/exportar-drive` corriendo a las 6 AM

## 5. Transferir ownership del Drive

1. Abrir https://drive.google.com/drive/folders/1uqUA7UinAOTxxDoX7Rn8r2W3Gw6BysFv
2. Compartir → Agregar `anfiteatrodevillacr@gmail.com` como **Editor**
3. (Opcional) Transferir ownership completo desde Drive UI

## 6. Wire-up final del export a Drive (opcional, para la primera semana)

El cron actual esta implementado pero el upload real a Drive falta. Opciones:

A) Manual: ejecutar `node scripts/exportar-drive.mjs` cuando se quiera
   - Requiere `google-sa.json` con un Service Account que tenga acceso a la carpeta

B) Programatico: agregar codigo en `/api/cron/exportar-drive.ts` para subir via googleapis
   - Requiere `GOOGLE_SERVICE_ACCOUNT_JSON` como variable de entorno en Vercel

Por ahora (A) es lo mas simple y seguro. Se puede agregar (B) despues.

## Verificacion post-deploy

- [ ] `https://anfiteatro-reviews-eight.vercel.app/` carga el formulario de Cavernas
- [ ] Enviar una resena de prueba, verificar que aparece en Supabase tabla `resenas`
- [ ] Verificar que el codigo de cortesia aparece y se puede copiar
- [ ] Abrir `/dashboard`, ver la resena en el tab Resenas
- [ ] Canjear el codigo desde el dashboard, verificar que cambia a estado 'canjeado'