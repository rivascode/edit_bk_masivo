# Gestion Masiva de Bookings

Demo funcional para validar el modulo **Gestion Masiva de Bookings** de Iturri App. La pantalla simula una hoja tipo Excel para revisar, ordenar, mover y editar bookings/embarques de exportacion a nivel de contenedor.

Sitio publicado:

```text
https://rivascode.github.io/edit_bk_masivo/
```

Repositorio:

```text
https://github.com/rivascode/edit_bk_masivo
```

## Objetivo

Permitir que usuarios operativos puedan gestionar masivamente informacion de bookings sin entrar registro por registro. La demo sirve para validar experiencia de usuario, orden de columnas, reglas basicas de edicion y estructura de datos antes de conectarlo a endpoints reales en PHP 7.

## Alcance actual

- Tabla editable tipo Excel.
- 29 registros de ejemplo modelados a nivel de contenedor.
- Orden de columnas basado en la fila 1 del archivo `Libro1.xlsx`.
- Ordenamiento de filas desde encabezados y desde selector superior.
- Reordenamiento manual de columnas por arrastre.
- Movimiento de columnas con botones izquierda/derecha.
- Boton para restaurar el orden original del Excel.
- Colores por `FECHA CARGA` para identificar rapidamente dias con varios embarques.
- Casos de ejemplo con varios bookings el mismo dia.
- Casos de ejemplo donde un mismo booking tiene varios contenedores.
- Edicion directa en celdas.
- Resaltado amarillo para cambios pendientes.
- Resaltado rojo para errores de validacion.
- Guardado simulado con resumen de cambios.
- Auditoria simulada en pantalla.
- Exportacion simple a Excel mediante archivo `.xls` con contenido CSV compatible.

## Fuera de alcance por ahora

- Persistencia real en base de datos.
- Autenticacion y permisos por usuario.
- Bloqueo concurrente de registros.
- Auditoria real en backend.
- Validaciones aduaneras completas.
- Integracion con SUNAT, navieras, almacenes, terminales o sistemas documentarios.
- Exportacion `.xlsx` nativa con estilos y multiples hojas.

## Tecnologia usada

| Componente | Uso | Motivo |
|---|---|---|
| HTML5 | Estructura de la pantalla | Compatible con despliegue estatico y facil de migrar a vistas PHP |
| CSS3 | Estilos, tabla compacta, colores por fecha, estados visuales | Evita dependencia de frameworks pesados |
| JavaScript ES5/ES6 basico | Logica de grilla, ordenamiento, validacion y exportacion | Compatible con navegadores modernos sin build step |
| AngularJS 1.8.3 | Binding de datos, directivas, filtros, `ng-repeat`, `ng-options` | Requisito del proyecto: no Angular 2+, React ni Vue |
| Mock JSON | Datos de ejemplo en `data.json` | Permite validar sin BD |
| Python HTTP Server | Servidor local simple | Suficiente para servir `data.json` por HTTP |
| GitHub Pages | Publicacion estatica de la demo | Facil de compartir con usuarios |

## Librerias externas

Solo se usa una libreria externa en runtime:

```html
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.3/angular.min.js"></script>
```

No se usa npm, Webpack, Vite, React, Vue, Bootstrap ni jQuery.

Esta decision es intencional: para una maqueta conectable a PHP 7, meter un stack moderno completo seria sobredimensionar el problema. Bonito para una demo de tecnologia, mala idea para mantenimiento si el sistema base no va por ahi.

## Documentacion de referencia

| Tema | Referencia |
|---|---|
| AngularJS API | https://docs.angularjs.org/api |
| `ngRepeat` | https://docs.angularjs.org/api/ng/directive/ngRepeat |
| `ngOptions` | https://docs.angularjs.org/api/ng/directive/ngOptions |
| HTML Drag and Drop API | https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API |
| `DataTransfer` | https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer |
| `Blob` | https://developer.mozilla.org/en-US/docs/Web/API/Blob |
| `URL.createObjectURL()` | https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static |
| GitHub Pages source branch/root | https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site |

## Estructura de archivos

```text
edit_bk_masivo/
├── index.html
├── app.js
├── styles.css
├── data.json
└── README.md
```

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Layout principal, filtros, toolbar, grilla, auditoria simulada y modal de guardado |
| `app.js` | Controlador AngularJS, directiva de drag & drop, validaciones, ordenamiento, auditoria y exportacion |
| `styles.css` | Estilos administrativos, tabla compacta, colores por fecha, celdas modificadas y errores |
| `data.json` | Mock de registros de ejemplo |
| `README.md` | Documentacion tecnica y funcional |

## Ejecucion local

Desde la carpeta del proyecto:

```bash
python3 -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

No abrir directamente `index.html` con doble clic si se quiere cargar `data.json`, porque el navegador puede bloquear solicitudes locales por politicas de seguridad.

## Orden de columnas

El orden de columnas se tomo del archivo:

```text
/Users/rivascode/Desktop/Libro1.xlsx
```

Encabezados detectados en la fila 1:

```text
estado
FECHA CARGA
BOOKING
REG
O.D
DAM
CANAL
REF
VGM
DF
vb
OBSERVACION
OPERADOR
EMBARCADOR
NAVE
MFTO
TIPO DE EMB.
ADUANA
OS/ NºDUA
MFTO
DESTINO
LINEA
CANT
MERCANCIA
DT
CITA
CONTENEDOR
BOLSA P.A.
FACTURACION
CODIGO DE PAGO
INSUMOS
```

Importante: el Excel contiene `MFTO` dos veces. En pantalla se respeta visualmente el nombre `MFTO` en ambas columnas, pero internamente se usan claves distintas para no mezclar datos durante edicion, ordenamiento o exportacion.

## Mapeo de columnas

| Columna Excel | Campo interno | Comentario |
|---|---|---|
| estado | `damStatus` | Estado operativo/DAM |
| FECHA CARGA | `loadDate` | Fecha principal de agrupacion visual |
| BOOKING | `bookingNumber` | Numero de booking |
| REG | `registry` | Registro operativo simulado |
| O.D | `od` | Orden/documento operativo simulado |
| DAM | `damNumber` | Numero DAM |
| CANAL | `channel` | Canal simulado: VERDE, NARANJA, ROJO |
| REF | `referenceCode` | Referencia del booking/contenedor |
| VGM | `vgm` | Indicador VGM enviado |
| DF | `dfSent` | Datos finales enviados |
| vb | `vb` | Visto bueno simulado |
| OBSERVACION | `observation` | Observaciones operativas |
| OPERADOR | `operator` | Usuario/responsable operativo |
| EMBARCADOR | `client` | Cliente/exportador |
| NAVE | `vessel` | Nave |
| MFTO | `manifest` | Manifiesto principal |
| TIPO DE EMB. | `shipmentType` | Tipo de embarque |
| ADUANA | `customsOffice` | Aduana de salida |
| OS/ NºDUA | `orderDua` | Orden de servicio / DUA |
| MFTO | `manifest2` | Segunda columna MFTO del Excel |
| DESTINO | `destination` | Destino |
| LINEA | `line` | Linea naviera |
| CANT | `containerQty` | Cantidad total de contenedores del BK |
| MERCANCIA | `product` | Producto |
| DT | `dt` | Documento/transporte simulado |
| CITA | `appointment` | Fecha/hora de cita |
| CONTENEDOR | `containerNumber` | Numero de contenedor |
| BOLSA P.A. | `paBag` | Indicador operativo simulado |
| FACTURACION | `billing` | Estado de facturacion |
| CODIGO DE PAGO | `paymentCode` | Codigo de pago simulado |
| INSUMOS | `supplies` | Insumos asociados |

## Datos de ejemplo

El archivo `data.json` contiene 29 filas. La unidad de trabajo de la grilla es **contenedor**, no solo booking. Esto es importante porque un booking puede tener varios contenedores y cada contenedor puede requerir seguimiento individual.

Distribucion por fecha de carga:

| Fecha carga | Registros |
|---|---:|
| 2026-06-12 | 6 |
| 2026-06-13 | 12 |
| 2026-06-14 | 4 |
| 2026-06-15 | 3 |
| 2026-06-16 | 4 |

Casos multi-contenedor:

| Booking | Filas / contenedores |
|---|---:|
| BK-2026-0100 | 4 |
| BK-2026-0103 | 10 |

Cada fila de esos bookings repite datos comunes del booking y cambia el campo `CONTENEDOR`, `REF`, `CITA` y otros campos operativos. Este modelo es mas realista para operaciones: si se edita todo a nivel cabecera, luego aparece el clasico "un contenedor se fue por su cuenta" y el sistema queda corto.

## Comportamiento de la grilla

### Edicion directa

Cada celda editable usa `ng-model` apuntando al campo correspondiente del registro. Al modificar una celda:

1. Se compara contra la copia original cargada.
2. Si el valor cambio, se marca la celda en amarillo.
3. Se registra una entrada en auditoria simulada.
4. Se ejecutan validaciones basicas.

### Ordenamiento

Hay dos formas de ordenar:

- Clic en el encabezado de columna.
- Selector superior `Ordenar por columna` con botones `Ascendente`, `Descendente` y `Limpiar orden`.

El ciclo de ordenamiento por encabezado es:

```text
sin orden -> ascendente -> descendente -> sin orden
```

Los campos numericos y fechas tienen comparadores propios. El resto se ordena como texto con `localeCompare`.

### Movimiento de columnas

El usuario puede mover columnas de dos formas:

- Arrastrando el encabezado de una columna sobre otra.
- Usando los botones `‹` y `›` dentro del encabezado.

El orden personalizado se guarda en `localStorage` con la clave:

```text
iturriBookingColumnOrder.excel.v2
```

El boton `Restaurar columnas del Excel` elimina esa configuracion local y vuelve al orden base del Excel.

### Colores por fecha de carga

Cada fecha de carga tiene una clase visual:

```text
date-group-0 ... date-group-7
```

La asignacion se calcula segun las fechas cargadas. Los colores permiten identificar rapidamente varios embarques del mismo dia. Si una celda tiene cambio pendiente o error, el color de cambio/error tiene prioridad sobre el color de fecha.

## Validaciones actuales

| Campo | Regla |
|---|---|
| FECHA CARGA | Debe tener formato `YYYY-MM-DD` |
| ETA | Debe tener formato `YYYY-MM-DD` |
| Fecha numeracion | Si existe, debe tener formato `YYYY-MM-DD` |
| CANT | Debe ser numerico y mayor o igual a cero |
| Equipment Size | Solo `20` o `40` en el modelo interno |
| estado | Solo `Pendiente`, `Numerado`, `Observado`, `Enviado` |
| DF | Solo `Sí` o `No` |
| Refrendo enviado | Solo `Sí` o `No` en el modelo interno |

Nota: algunas columnas internas del primer prototipo se mantienen para compatibilidad con la data base anterior, aunque no todas se muestran como columnas principales del Excel.

## Auditoria simulada

La seccion inferior registra:

- Usuario.
- Fecha/hora.
- Booking.
- Campo modificado.
- Valor anterior.
- Valor nuevo.

En produccion, esta auditoria no debe depender del navegador. Debe guardarse en backend con usuario autenticado, IP, fecha servidor, request ID y version anterior/nueva del dato.

## Exportacion

La exportacion actual genera un archivo:

```text
gestion-masiva-bookings.xls
```

Internamente es CSV con BOM UTF-8 y extension `.xls` para facilitar apertura en Excel. Para produccion se recomienda generar `.xlsx` real desde backend si se requiere:

- Estilos.
- Filtros nativos.
- Congelamiento de encabezados.
- Multiples hojas.
- Tipos de datos correctos.
- Auditoria o resumen de cambios.

## Preparacion para backend PHP 7

La carga actual usa:

```javascript
$http.get('data.json', { cache: false })
```

Para conectarlo a backend real, reemplazar por endpoints:

| Metodo | Endpoint sugerido | Uso |
|---|---|---|
| GET | `/api/bookings` | Listar registros filtrables |
| POST | `/api/bookings/bulk-update` | Guardar cambios masivos |
| GET | `/api/bookings/export` | Exportar datos |
| GET | `/api/catalogs/booking-options` | Cargar estados, lineas, operadores, canales |
| GET | `/api/bookings/audit` | Consultar auditoria |

### Payload sugerido para guardado

```json
{
  "requestId": "uuid",
  "user": "usuario@empresa.com",
  "changes": [
    {
      "id": 1,
      "bookingNumber": "BK-2026-0100",
      "containerNumber": "TCLU1200037",
      "field": "loadDate",
      "oldValue": "2026-06-12",
      "newValue": "2026-06-13"
    }
  ]
}
```

### Respuesta sugerida

```json
{
  "success": true,
  "updated": 1,
  "rejected": [],
  "auditBatchId": "AUD-2026-000001"
}
```

## Reglas tecnicas para produccion

- Validar nuevamente en backend. La validacion frontend solo mejora experiencia, no protege datos.
- Guardar cambios en transaccion.
- Registrar auditoria por campo modificado.
- Manejar concurrencia con `updated_at`, version de registro o bloqueo optimista.
- No permitir que un usuario edite bookings fuera de su permiso operativo.
- Separar catalogos de data transaccional.
- Mantener claves internas estables aunque el nombre visible de la columna cambie.
- Definir si la unidad de edicion oficial sera booking, contenedor o ambos.
- Evitar guardar orden de columnas solo en navegador si se necesita preferencia por usuario; llevarlo a tabla de preferencias.

## Riesgos y decisiones pendientes

| Tema | Riesgo | Recomendacion |
|---|---|---|
| Booking con varios contenedores | Si se edita solo cabecera, se pierden diferencias por contenedor | Modelar cabecera booking + detalle contenedor |
| Columnas duplicadas como `MFTO` | Ambiguedad en guardado/exportacion | Mantener label visible duplicado, pero claves internas diferentes |
| Edicion masiva | Cambios accidentales en muchas filas | Agregar confirmacion con resumen y auditoria real |
| Concurrencia | Dos usuarios pueden pisarse datos | Usar bloqueo optimista |
| Exportacion | CSV con extension `.xls` no cubre reportes formales | Generar `.xlsx` real desde backend |
| Performance | Muchas filas en AngularJS pueden degradar | Paginacion, virtual scroll o carga por filtros para volumen alto |

## Criterios de aceptacion sugeridos

1. El usuario visualiza columnas en el mismo orden del Excel base.
2. El usuario puede ordenar por cualquier columna visible.
3. El usuario puede mover columnas y restaurar el orden original.
4. El usuario identifica por color los embarques de la misma fecha de carga.
5. El usuario visualiza varios registros para un mismo BK cuando existen varios contenedores.
6. El sistema resalta cambios pendientes antes de guardar.
7. El sistema bloquea guardado cuando existen errores de validacion.
8. El sistema muestra resumen de cambios antes/despues del guardado simulado.
9. La auditoria simulada muestra usuario, fecha/hora, booking, campo, valor anterior y valor nuevo.
10. La estructura queda preparada para reemplazar `data.json` por endpoints PHP 7.

## Despliegue actual

La demo esta publicada con GitHub Pages desde:

```text
branch: main
path: /
```

GitHub Pages permite publicar desde una rama y carpeta fuente, incluyendo la raiz `/` del repositorio.
