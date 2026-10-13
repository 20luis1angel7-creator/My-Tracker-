# Ritmo · Registro de recaídas

Aplicación web en español para registrar las veces que ocurre un mal hábito, describir lo sucedido y añadir comentarios o reflexiones. Permite editar y eliminar registros, buscar, filtrar por hábito y exportar una copia JSON. Empieza vacía, sin datos de ejemplo. Incluye modo claro y oscuro con preferencia guardada y una lista independiente de hábitos reutilizables.

## Estructura

```text
ritmo/
├── src/                 # Código fuente editable
│   ├── index.html       # Pantalla y formulario
│   ├── css/styles.css   # Estilos y adaptación a móvil
│   └── js/
│       ├── app.js       # Interfaz, eventos, guardado y exportación
│       └── model.js     # Validación, búsqueda y cálculos
├── scripts/build.mjs   # Copia src/ a dist/ para publicar
├── tests/model.test.mjs # Pruebas de la lógica de registros
├── dist/                # Archivos generados para servir la aplicación
├── .openai/hosting.json # Configuración del sitio existente
├── package.json         # Comandos del proyecto, sin dependencias
└── README.md
```

## Uso local

Requiere Node.js 18 o superior; el servidor de ejemplo requiere Python 3.

```bash
npm test
npm run build
npm start
```

Abre http://localhost:8080. Modifica `src/` y ejecuta `npm run build` para actualizar `dist/`.

## Datos

Los registros se guardan en localStorage con la clave `ritmo-relapses-v1`. No se sincronizan entre dispositivos. Una entrada puede contener varias ocurrencias; el resumen suma esas cantidades, no solo el número de entradas. Las fechas se interpretan en la zona horaria del navegador. Exportar descarga una copia JSON; la aplicación no incorpora importación.

El tracker de tareas anterior fue reemplazado. Su clave `ritmo-tasks-v1` ya no se lee ni se usa. Sus datos antiguos, si existían en un navegador, no se convierten en recaídas.

## Hábitos y apariencia

Los hábitos se guardan con la clave `ritmo-habits-v1`, independientemente de sus registros. Los nombres del historial existente se incorporan a la lista automáticamente. El formulario de registro permite escribir libremente, guardar el nombre con el botón «Guardar» o elegir uno del desplegable; también se puede pulsar un hábito en la lista para registrar una recaída. Los nombres duplicados se detectan ignorando mayúsculas y espacios exteriores. La exportación incluye hábitos y registros.

El tema se guarda en `ritmo-theme-v1`; en la primera visita se respeta la preferencia del sistema. Las tarjetas de resumen se retiraron para dejar espacio a una futura sección gráfica.

## Navegación

El menú lateral permite alternar entre `#historial` y `#habitos`. «Añadir hábito» muestra el formulario para guardar un nombre y la lista existente. En móvil, el menú se adapta a la parte superior.

## Calendario y fechas

Las fechas pertenecen a cada recaída, tanto al crearla como al editarla. El inicio es obligatorio; el final es opcional y no puede ser anterior al inicio ni estar en el futuro. Los registros anteriores conservan su fecha como inicio y no tienen final hasta que se editen. El calendario muestra cada recaída una sola vez en su día de inicio, y presenta las dos fechas en el detalle del mismo registro. Los hábitos guardados contienen únicamente sus nombres. La antigua clave de fechas de hábitos ya no se usa y no se aplica a las recaídas.

El menú se contrae en escritorio y conserva su estado. En móvil, el logo abre un panel desde la izquierda; se cierra al seleccionar una opción, pulsar fuera, pulsar el botón de cierre o usar Escape.

Registrar una recaída no añade automáticamente su nombre a la lista de hábitos. El botón «Guardar» junto al campo Hábito se habilita cuando hay texto y guarda solo el nombre, sin enviar el formulario de recaída. El desplegable muestra exclusivamente los nombres guardados. El filtro del historial incluye también los nombres usados en registros libres.
