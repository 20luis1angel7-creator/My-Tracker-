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

Los hábitos se guardan con la clave `ritmo-habits-v1`, independientemente de sus registros. Los nombres del historial existente se incorporan a la lista automáticamente. El formulario de registro usa un selector; también se puede pulsar un hábito en la lista para registrar una recaída. Los nombres duplicados se detectan ignorando mayúsculas y espacios exteriores. La exportación incluye hábitos y registros.

El tema se guarda en `ritmo-theme-v1`; en la primera visita se respeta la preferencia del sistema. Las tarjetas de resumen se retiraron para dejar espacio a una futura sección gráfica.
