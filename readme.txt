name=README.md
# donaciones

Repositorio prototipo para dashboard de donaciones / inventario.

Resumen:
- Apps Script (apps_script.gs): extrae tablas de tu Google Sheet (busca encabezados) y envía un JSON al webhook.
- Backend (Next.js):
  - POST /api/webhook -> recibe snapshot (valida header `x-webhook-secret`) y guarda en `data/snapshot.json`.
  - GET /api/contabilidad -> devuelve `contabilidades`.
  - GET /api/inventario -> devuelve `inventario`.
  - GET /api/donado -> devuelve `donado`.
- Frontend (pages/index.js): dashboard con 3 pestañas (Contabilidad, Inventario, Donaciones). Muestra totales y tablas; paginación básica en Donaciones.

Despliegue:
1. Reemplaza `webhookUrl` y `webhookSecret` en `apps_script.gs` (pon la URL pública que obtengas al desplegar en Vercel).
2. En Vercel configura la variable de entorno `SECRET_WEBHOOK` con el mismo valor del `webhookSecret`.
3. Despliega el proyecto en Vercel o ejecuta local:
   - npm install
   - npm run dev
4. Pega `apps_script.gs` en Tools > Script editor de tu Google Sheet y ejecuta `sendSnapshotToWebhook()` una vez para enviar el primer snapshot.

Notas:
- La persistencia en `data/snapshot.json` es solo para prototipo (en Vercel el filesystem es efímero). Para producción considera una base de datos o storage (Cloud Storage, supabase, etc.).
- El Apps Script intenta detectar tablas por encabezados ("INVENTARIO", "ENTRADAS", "DONADO", "CUENTA", "CONTABILIDAD") y parsea números con coma decimal.
- No hay login; la página es de solo información pública.

Si quieres, subo estos archivos al repo "donaciones" si me das permiso (o los copias y haces el primer commit). Dime si quieres que también monte un deploy en Vercel y lo configure por ti.