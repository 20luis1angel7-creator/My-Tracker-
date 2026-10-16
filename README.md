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

## Inicialización completa

Requisitos: Node.js 22 o superior, npm, Docker y Docker Compose. Docker debe estar iniciado. Ejecuta los comandos desde la carpeta `ritmo`.

### Primera vez

```bash
cd "/home-data/luis/Escritorio/app tracker/ritmo"
npm ci
```

Crear `.env` solamente si todavía no existe (no sobrescribe tu configuración):

```bash
if [ ! -f .env ]; then
  cp .env.example .env
fi
```

Iniciar PostgreSQL y esperar a que esté listo:

```bash
docker compose up -d --wait postgres
```

Iniciar la aplicación:

```bash
npm start
```

`npm start` compila automáticamente TypeScript mediante `prestart` y después inicia el backend, que también sirve el frontend. No necesitas abrir otro servidor para el frontend. El arranque crea las tablas necesarias y la cuenta de prueba si todavía no existe.

Abre **http://localhost:8080** e inicia sesión con:

- Usuario: `admin`
- Contraseña de prueba: `123456`

Para importar tus datos anteriores, usa el mismo navegador y la misma dirección donde los tenías. La importación ocurre al entrar como admin y conserva la copia original.

### Cada vez que vuelvas a trabajar

```bash
cd "/home-data/luis/Escritorio/app tracker/ritmo"
docker compose up -d --wait postgres
npm start
```

Si cambiaste código mientras el servidor estaba abierto, detenlo con **Ctrl+C** y ejecuta de nuevo `npm start`. Recarga la página después. Si cambian las dependencias o acabas de descargar el proyecto, ejecuta `npm ci` antes de arrancar.

### Detener y volver a iniciar

En la terminal del servidor pulsa **Ctrl+C**. Después puedes detener PostgreSQL sin borrar sus datos:

```bash
docker compose stop postgres
```

Para volver a iniciar todo:

```bash
docker compose up -d --wait postgres
npm start
```

No uses `docker compose down -v`: elimina el volumen donde se guardan los datos.

### Comprobar PostgreSQL

```bash
docker compose ps
docker compose exec postgres pg_isready -U ritmo -d ritmo
docker compose logs --tail=50 postgres
```

Abrir la consola SQL:

```bash
docker compose exec postgres psql -U ritmo -d ritmo
```

Para salir de la consola SQL escribe `\q`.

La conexión local usa el puerto **55432**; dentro del contenedor PostgreSQL escucha en **5432**. `DATABASE_URL` está configurado en `.env`, que no se guarda en Git.

### Comandos de desarrollo

```bash
npm run typecheck  # Comprobar tipos sin generar archivos
npm run build      # Compilar y generar build/ y dist/
npm test           # Compilar y ejecutar las pruebas
npm start          # Compilar y arrancar frontend + backend
```

Edita `frontend/`, `backend/` y `shared/`; `build/` y `dist/` son archivos generados.

### Si el puerto de la aplicación está ocupado

Cierra la instancia anterior con **Ctrl+C**. Si la suspendiste con **Ctrl+Z**, ejecuta `fg` en esa misma terminal y luego pulsa **Ctrl+C**.

Para arrancar en otro puerto:

```bash
PORT=8081 npm start
```

En ese caso abre http://localhost:8081. Recuerda que los datos antiguos del navegador se asocian a su dirección original: usa el puerto anterior para importarlos.

## Backend

- `GET /api/health`: estado del servidor.
- `POST /api/entries/validate`: valida un registro enviado como JSON.
- `POST /api/statistics`: recibe `{ entries, date, metric, category }` y devuelve los siete días de la semana. `metric` acepta `time` o `count`.

El backend se ejecuta en local con `npm start`. La publicación anterior en Sites es estática: los endpoints nuevos se ejecutan con el servidor local. El backend local tiene PostgreSQL, autenticación y almacenamiento por usuario. La versión publicada anteriormente en Sites conserva el comportamiento anterior hasta que se despliegue explícitamente un backend compatible.

## Datos y comportamiento

La interfaz conserva las claves existentes de localStorage y los registros del navegador. Crear una recaída permite elegir hábito o clase. Inicio obligatorio, final opcional. El calendario muestra cada registro una sola vez en su día inicial, con ambas fechas en el detalle. La gráfica calcula la duración entre inicio y final una vez por registro; los registros abiertos no aportan tiempo y sí aportan su cantidad. Los intervalos superpuestos se suman.

Mis hábitos separa el guardado de nombres del guardado de clases con múltiples subclases. Los nombres se muestran al abrir el desplegable. Los datos se exportan en JSON y se guardan por usuario en PostgreSQL.

## Verificación de interfaz

`npm test` también ejecuta flujos del frontend en un DOM simulado: guardar nombres y múltiples subclases, crear y editar ambos tipos de recaída, buscar, eliminar, navegar por calendario y estadísticas, cambiar tema y abrir/cerrar el menú móvil. Esto verifica eventos y persistencia; no sustituye una revisión visual en un navegador real.

## Puerto ocupado y Ctrl+Z

Ctrl+Z suspende el proceso y mantiene su puerto ocupado. Usa `fg` y después Ctrl+C para cerrarlo. Sin PORT explícito, el servidor prueba los puertos 8080–8100 hasta encontrar uno disponible y muestra la URL real. Si especificas PORT, respeta ese puerto e informa claramente si está ocupado.

## Tracker mensual

El menú Tracker aparece debajo de Calendario. Permite crear hábitos diarios, definir metas mensuales (1–31 días), marcar o desmarcar días y consultar completados, porcentaje y rachas del mes. Las fechas futuras están deshabilitadas. Los datos se guardan en `ritmo-tracker-v1`; las marcas se conservan al cambiar de mes y al recargar. En móvil la tabla se desplaza horizontalmente.


## PostgreSQL y cuentas

La aplicación local ahora requiere PostgreSQL. Los cambios permanecen sin commit, sin push y sin publicación. La web de Sites anterior no se actualiza con esta integración.

Consulta «Inicialización completa» al principio de este documento para los comandos de arranque.

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
