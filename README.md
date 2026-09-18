# LEO-TECH Service

Sistema personal para registrar y gestionar mantenimientos de PC y notebooks.

## Objetivo

Priorizar la velocidad de registro. El sistema tendrá tres niveles:

- **Rápido:** marca, modelo, problema y trabajo.
- **Normal:** agrega cliente y datos habituales.
- **Completo:** agrega número de serie, estado físico, accesorios y observaciones.

## Estructura inicial

- `index.html` — interfaz.
- `style.css` — diseño responsive.
- `app.js` — lógica inicial y almacenamiento local.

## Próximas etapas

1. Conectar los registros con Google Sheets mediante Google Apps Script.
2. Incorporar ficha e historial por equipo.
3. Generar comprobantes PDF sin firmas.
4. Agregar fotos y almacenamiento en Google Drive.
5. Incorporar búsqueda, filtros y estadísticas.

> Esta primera versión guarda los registros en el navegador para probar la interfaz. Todavía no usa datos reales ni Google Sheets.


## Arquitectura del proyecto

La aplicación está organizada por módulos para evitar que una modificación en una función rompa todo el sistema:

- `js/main.js` — punto de entrada y eventos de la interfaz.
- `js/core.js` — estado compartido, selectores, utilidades y mensajes.
- `js/storage.js` — almacenamiento local/IndexedDB y fotos offline.
- `js/equipment.js` — catálogo de marcas y modelos.
- `js/dashboard.js` — Inicio e Historial.
- `js/navigation.js` — navegación y modos Rápido/Normal/Completo.
- `js/services.js` — creación y guardado de servicios.
- `js/sync.js` — conexión y sincronización con Supabase.

El archivo `app.js` monolítico anterior fue retirado. Las nuevas funciones deben agregarse al módulo correspondiente, evitando mezclar navegación, almacenamiento, Supabase y formularios en un único archivo.
