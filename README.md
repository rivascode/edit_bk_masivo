# Gestion Masiva de Bookings

Demo funcional en AngularJS para validar una pantalla tipo Excel de edicion masiva de bookings/embarques en Iturri App.

## Ejecucion local

```bash
python3 -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

## Alcance de la demo

- Tabla editable con 29 registros de ejemplo, modelados a nivel de contenedor.
- Orden de columnas basado en la plantilla `Libro1.xlsx`.
- Ordenamiento de filas por encabezado o selector superior.
- Reordenamiento manual de columnas con arrastre o botones laterales.
- Colores por fecha de carga para identificar dias con varios embarques.
- Casos de ejemplo con un mismo BK repetido por varios contenedores: 4 y 10 contenedores.
- Filtros por booking, cliente, operador, linea, estado DAM y rango de fecha de carga.
- Resaltado amarillo para celdas modificadas.
- Resaltado rojo para errores de validacion.
- Guardado simulado con resumen de cambios.
- Auditoria simulada de modificaciones en la sesion.
- Exportacion simple a Excel mediante archivo `.xls` con contenido CSV compatible.

## Preparacion para PHP 7

La carga actual usa `data.json` mediante `$http.get`. Para conectar backend real, reemplazar ese origen por endpoints como:

- `GET /api/bookings`
- `POST /api/bookings/bulk-update`
- `GET /api/bookings/export`

El guardado real debe ser transaccional y registrar auditoria en servidor. Validar solo en frontend seria optimista; en aduanas eso suele terminar en una reunion incomoda.
