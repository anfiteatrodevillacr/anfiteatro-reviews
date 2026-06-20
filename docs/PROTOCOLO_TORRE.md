# Protocolo TORRE aplicado

Este proyecto sigue el protocolo TORRE v1.0 del repo `C:\Users\Picado\torre`.

## Constitucion aplicada

- MAESTRO.md → leido por todas las plataformas al abrir sesion
- INDICE-CODIGO.md → este proyecto esta registrado como entrada #11
- COMUNICACION.md → eventos.jsonl recibe 1 linea por sesion

## Convenciones del proyecto

- **Persona**: anfiteatro (cuenta del cliente, NO Cawhi, NO Personal)
- **GitHub**: `anfiteatrodevillacr/anfiteatro-reviews`
- **Vercel**: team Anfiteatro (configurar en Vercel al primer deploy)
- **Supabase**: organizacion Anfiteatro (configurar al crear el proyecto)
- **Drive**: `anfiteatrodevillacr@gmail.com` (transferir ownership desde la cuenta donde se creo)

## Eventos generados

Cada vez que se hace una sesion sobre este proyecto:

1. Agregar linea a `C:\Users\Picado\torre\protocolo\eventos.jsonl` con `proyecto:anfiteatro-reviews`
2. Si se creo/modulo un modulo reusable, agregar entrada en `INDICE-CODIGO.md`
3. Actualizar `C:\Users\Picado\centro-comando\src\lib\projects.ts` si cambio el estado/proposito/URL

## Handoff

- Si la sesion se llena al ~85%, ejecutar skill `handoff-v2` desde `C:\Users\Picado\torre\skills\handoff-v2`
- El puente va a `C:\Users\Picado\torre\handoffs\PUENTE.md`