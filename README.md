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

El backend se ejecuta en local con `npm start`. La publicación anterior en Sites es estática: los endpoints nuevos se ejecutan con el servidor local. El backend local tiene PostgreSQL, autenticación y almacenamiento por usuario. La versión publicada anteriormente en Sites conserva el comportamiento anterior hasta que se despliegue explícitamente un backend compatible.

## Datos y comportamiento

La interfaz conserva las claves existentes de localStorage y los registros del navegador. Crear una recaída permite elegir hábito o clase. Inicio obligatorio, final opcional. El calendario muestra cada registro una sola vez en su día inicial, con ambas fechas en el detalle. La gráfica calcula la duración entre inicio y final una vez por registro; los registros abiertos no aportan tiempo y sí aportan su cantidad. Los intervalos superpuestos se suman.

Mis hábitos separa el guardado de nombres del guardado de clases con múltiples subclases. Los nombres se muestran al abrir el desplegable. Los datos se exportan en JSON y no se sincronizan entre dispositivos.

## Verificación de interfaz

`npm test` también ejecuta flujos del frontend en un DOM simulado: guardar nombres y múltiples subclases, crear y editar ambos tipos de recaída, buscar, eliminar, navegar por calendario y estadísticas, cambiar tema y abrir/cerrar el menú móvil. Esto verifica eventos y persistencia; no sustituye una revisión visual en un navegador real.

## Puerto ocupado y Ctrl+Z

Ctrl+Z suspende el proceso y mantiene su puerto ocupado. Usa `fg` y después Ctrl+C para cerrarlo. Sin PORT explícito, el servidor prueba los puertos 8080–8100 hasta encontrar uno disponible y muestra la URL real. Si especificas PORT, respeta ese puerto e informa claramente si está ocupado.

## Tracker mensual

El menú Tracker aparece debajo de Calendario. Permite crear hábitos diarios, definir metas mensuales (1–31 días), marcar o desmarcar días y consultar completados, porcentaje y rachas del mes. Las fechas futuras están deshabilitadas. Los datos se guardan en `ritmo-tracker-v1`; las marcas se conservan al cambiar de mes y al recargar. En móvil la tabla se desplaza horizontalmente.


## PostgreSQL y cuentas

La aplicación local ahora requiere PostgreSQL. Los cambios permanecen sin commit, sin push y sin publicación. La web de Sites anterior no se actualiza con esta integración.

```bash
npm install
docker compose up -d postgres
# Si aún no existe .env: copia .env.example a .env
npm run build
npm start
```

`DATABASE_URL` está en `.env` (ignorado por Git). El contenedor usa un volumen persistente llamado `ritmo_postgres`. El inicio crea las tablas y, solo si no existe, la cuenta `admin` con la contraseña `123456`. Cambiar `ADMIN_PASSWORD` no restablece usuarios existentes. No uses `docker compose down -v` si quieres conservar los datos.

Al entrar como admin desde el mismo navegador y la misma dirección donde estaban tus datos, se importan registros, hábitos, clases y tracker en una transacción. La copia original de localStorage no se borra y se crea además `ritmo-original-backup-v1`. Cada copia se identifica por una huella: volver a entrar no la importa de nuevo ni resucita registros eliminados. Las cuentas nuevas empiezan vacías y no importan tus datos antiguos.

Si antes usabas localhost:8080, vuelve a entrar en esa misma dirección: localhost, 127.0.0.1, distintos puertos y Sites son orígenes separados y no comparten localStorage. La aplicación no puede leer los datos de otro origen. La migración real se completa cuando abres la app e inicias sesión como admin; el asistente no puede leer el localStorage de tu navegador desde los archivos del proyecto.

Los cambios se sincronizan con PostgreSQL y el estado aparece en la cabecera. Una copia por usuario y una cola de operaciones pendientes se conservan en el navegador para recuperarse de cortes de conexión. Pulsa el indicador para reintentar; cerrar sesión espera a que no queden cambios pendientes.

Las contraseñas se guardan con scrypt y sal aleatoria. Las sesiones usan cookies HttpOnly, SameSite=Strict y tokens almacenados como hash. Para un despliegue HTTPS configura `COOKIE_SECURE=true`. Estos datos no se guardan en el repositorio.

Pruebas de integración PostgreSQL (utiliza una base exclusiva para pruebas):

```bash
RITMO_TEST_DATABASE_URL=postgresql://usuario:clave@localhost/base_pruebas npm test
```

La prueba crea usuarios temporales e importa datos de prueba en la cuenta admin de esa base. No debe apuntar a tus datos reales.
