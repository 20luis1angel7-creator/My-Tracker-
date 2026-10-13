# Ritmo · TypeScript

Tracker de recaídas con hábitos, clases y subclases, calendario y estadísticas semanales. Interfaz en español, modos claro y oscuro y menú móvil lateral.

## Carpetas

```text
frontend/
  index.html              Pantallas y formularios
  src/
    app.ts                Interfaz y almacenamiento del navegador
    lib/                  Acceso a la lógica compartida
    styles/styles.css     Estilos responsive
backend/
  src/
    server.ts             Servidor HTTP local y archivos estáticos
    api.ts                Validación y estadísticas por HTTP
shared/
  types.ts                Tipos de registros, clases y eventos
  domain/
    model.ts              Validación, búsqueda y resumen
    calendar.ts           Eventos del calendario
    statistics.ts         Duraciones, semanas y desglose
scripts/build.ts          Empaquetado del frontend
 tests/                   Pruebas en TypeScript
build/                    TypeScript compilado (generado, ignorado en Git)
dist/                     Frontend generado para Sites
.openai/hosting.json       Identidad y publicación del sitio
package.json
package-lock.json
tsconfig.json             TypeScript en modo estricto
```

## Ejecutar

Requiere Node.js 20 o superior.

```bash
npm ci
npm run typecheck
npm test
npm start
```

Abre http://localhost:8080. `npm run build` compila TypeScript y genera `dist/`. `npm start` ejecuta el backend y sirve el frontend. `PORT` permite cambiar el puerto. Edita los archivos fuente, no `build/` ni `dist/`.

## Backend

- `GET /api/health`: estado del servidor.
- `POST /api/entries/validate`: valida un registro enviado como JSON.
- `POST /api/statistics`: recibe `{ entries, date, metric, category }` y devuelve los siete días de la semana. `metric` acepta `time` o `count`.

El backend se ejecuta en local con `npm start`. La publicación actual en Sites es estática y publica únicamente el frontend: los endpoints del backend no están desplegados ni conectados al formulario. El backend no tiene base de datos ni autenticación; calcula y valida los datos recibidos sin persistirlos.

## Datos y comportamiento

La interfaz conserva las claves existentes de localStorage y los registros del navegador. Crear una recaída permite elegir hábito o clase. Inicio obligatorio, final opcional. El calendario muestra cada registro una sola vez en su día inicial, con ambas fechas en el detalle. La gráfica calcula la duración entre inicio y final una vez por registro; los registros abiertos no aportan tiempo y sí aportan su cantidad. Los intervalos superpuestos se suman.

Mis hábitos separa el guardado de nombres del guardado de clases con múltiples subclases. Los nombres se muestran al abrir el desplegable. Los datos se exportan en JSON y no se sincronizan entre dispositivos.
