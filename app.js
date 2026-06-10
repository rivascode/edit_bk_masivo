(function () {
  'use strict';

  angular
    .module('bookingBulkApp', [])
    .directive('columnDrag', columnDrag)
    .controller('BookingBulkController', BookingBulkController);

  function columnDrag() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.attr('draggable', 'true');

        element.on('dragstart', function (event) {
          var dragEvent = event.originalEvent || event;
          dragEvent.dataTransfer.effectAllowed = 'move';
          dragEvent.dataTransfer.setData('text/plain', attrs.fieldKey);
          scope.$apply(function () {
            scope.vm.draggedFieldKey = attrs.fieldKey;
          });
        });

        element.on('dragover', function (event) {
          event.preventDefault();
          var dragEvent = event.originalEvent || event;
          dragEvent.dataTransfer.dropEffect = 'move';
          element.addClass('drop-target');
        });

        element.on('dragleave drop', function () {
          element.removeClass('drop-target');
        });

        element.on('drop', function (event) {
          event.preventDefault();
          var dragEvent = event.originalEvent || event;
          var sourceKey = dragEvent.dataTransfer.getData('text/plain') || scope.vm.draggedFieldKey;
          scope.$apply(function () {
            scope.vm.handleColumnDrop(sourceKey, attrs.fieldKey);
          });
        });
      }
    };
  }

  BookingBulkController.$inject = ['$http', '$filter'];

  function BookingBulkController($http, $filter) {
    var vm = this;

    vm.currentUser = 'demo.operaciones@iturri.local';
    vm.validDamStatuses = ['Pendiente', 'Numerado', 'Observado', 'Enviado'];
    vm.yesNoOptions = ['Sí', 'No'];
    vm.equipmentSizes = ['20', '40'];
    vm.shippingTypes = ['FCL', 'LCL', 'AEREO'];
    vm.containerTypes = ['REEFER', 'DRY', 'HIGH CUBE', 'OPEN TOP'];
    vm.columnOrderStorageKey = 'iturriBookingColumnOrder.excel.v2';

    vm.fields = [
      { key: 'damStatus', label: 'estado', type: 'select', options: vm.validDamStatuses },
      { key: 'loadDate', label: 'FECHA CARGA', inputType: 'text', dataType: 'date' },
      { key: 'bookingNumber', label: 'BOOKING' },
      { key: 'registry', label: 'REG' },
      { key: 'od', label: 'O.D' },
      { key: 'damNumber', label: 'DAM' },
      { key: 'channel', label: 'CANAL' },
      { key: 'referenceCode', label: 'REF' },
      { key: 'vgm', label: 'VGM', type: 'select', options: vm.yesNoOptions },
      { key: 'dfSent', label: 'DF', type: 'select', options: vm.yesNoOptions },
      { key: 'vb', label: 'vb', type: 'select', options: vm.yesNoOptions },
      { key: 'observation', label: 'OBSERVACION' },
      { key: 'operator', label: 'OPERADOR' },
      { key: 'client', label: 'EMBARCADOR' },
      { key: 'vessel', label: 'NAVE' },
      { key: 'manifest', label: 'MFTO' },
      { key: 'shipmentType', label: 'TIPO DE EMB.', type: 'select', options: vm.shippingTypes },
      { key: 'customsOffice', label: 'ADUANA' },
      { key: 'orderDua', label: 'OS/ NºDUA' },
      { key: 'manifest2', label: 'MFTO' },
      { key: 'destination', label: 'DESTINO' },
      { key: 'line', label: 'LINEA' },
      { key: 'containerQty', label: 'CANT', inputType: 'number', min: '0', dataType: 'number' },
      { key: 'product', label: 'MERCANCIA' },
      { key: 'dt', label: 'DT' },
      { key: 'appointment', label: 'CITA' },
      { key: 'containerNumber', label: 'CONTENEDOR' },
      { key: 'paBag', label: 'BOLSA P.A.' },
      { key: 'billing', label: 'FACTURACION' },
      { key: 'paymentCode', label: 'CODIGO DE PAGO' },
      { key: 'supplies', label: 'INSUMOS' }
    ];

    vm.defaultFieldOrder = vm.fields.map(function (field) {
      return field.key;
    });
    vm.sortState = {
      key: null,
      direction: null
    };
    vm.draggedFieldKey = null;
    vm.loadDateGroups = {};
    vm.bookings = [];
    vm.originalBookings = {};
    vm.changedCells = {};
    vm.validationErrors = {};
    vm.auditLog = [];
    vm.saveSummary = null;
    vm.filters = {};
    vm.filterOptions = {
      clients: [],
      operators: [],
      lines: []
    };

    vm.onCellChange = onCellChange;
    vm.cellClass = cellClass;
    vm.filteredBookings = filteredBookings;
    vm.cycleSort = cycleSort;
    vm.setSortDirection = setSortDirection;
    vm.clearSort = clearSort;
    vm.sortIcon = sortIcon;
    vm.activeSortLabel = activeSortLabel;
    vm.moveColumn = moveColumn;
    vm.handleColumnDrop = handleColumnDrop;
    vm.resetColumnOrder = resetColumnOrder;
    vm.rowDateClass = rowDateClass;
    vm.dateLegend = dateLegend;
    vm.pendingChangeCount = pendingChangeCount;
    vm.errorCount = errorCount;
    vm.hasPendingChanges = hasPendingChanges;
    vm.hasErrors = hasErrors;
    vm.saveChanges = saveChanges;
    vm.discardChanges = discardChanges;
    vm.exportExcel = exportExcel;
    vm.reloadData = reloadData;
    vm.closeSummary = closeSummary;

    applySavedColumnOrder();
    loadData();

    function loadData() {
      $http.get('data.json', { cache: false }).then(function (response) {
        setData(response.data);
      }, function () {
        setData(fallbackData());
      });
    }

    function setData(data) {
      vm.bookings = enrichBookings(angular.copy(data));
      vm.originalBookings = indexById(vm.bookings);
      vm.changedCells = {};
      vm.validationErrors = {};
      vm.auditLog = [];
      vm.saveSummary = null;
      buildLoadDateGroups();
      refreshFilterOptions();
      validateAll();
    }

    function enrichBookings(rows) {
      var channels = ['VERDE', 'NARANJA', 'ROJO'];

      return rows.map(function (row, index) {
        row.registry = row.registry || 'REG-' + pad(index + 1, 3);
        row.od = row.od || 'OD-' + (2400 + index + 1);
        row.channel = row.channel || channels[index % channels.length];
        row.vgm = row.vgm || (index % 3 === 0 ? 'No' : 'Sí');
        row.vb = row.vb || (row.damStatus === 'Enviado' ? 'Sí' : 'No');
        row.observation = row.observation || (row.damStatus === 'Observado' ? 'Revisar DAM y canal' : '');
        row.manifest = row.manifest || 'MFTO-' + (8000 + index + 1);
        row.orderDua = row.orderDua || row.orderNumber + ' / ' + row.damNumber;
        row.manifest2 = row.manifest2 || row.voyage;
        row.dt = row.dt || 'DT-' + (5000 + index + 1);
        row.appointment = row.appointment || row.loadDate + ' 08:00';
        row.paBag = row.paBag || (index % 2 === 0 ? 'APLICA' : 'NO APLICA');
        row.billing = row.billing || (row.damStatus === 'Enviado' ? 'FACTURADO' : 'PENDIENTE');
        row.paymentCode = row.paymentCode || 'CP-' + (900000 + index + 1);
        row.supplies = row.supplies || (row.containerType === 'REEFER' ? 'GENSET / PRECINTO' : 'PRECINTO');
        return row;
      });
    }

    function buildLoadDateGroups() {
      var dates = vm.bookings.map(function (row) {
        return row.loadDate;
      }).filter(function (value, index, values) {
        return value && values.indexOf(value) === index;
      }).sort();

      vm.loadDateGroups = dates.reduce(function (acc, date, index) {
        acc[date] = 'date-group-' + (index % 8);
        return acc;
      }, {});
    }

    function rowDateClass(row) {
      return vm.loadDateGroups[row.loadDate] || '';
    }

    function dateLegend() {
      return Object.keys(vm.loadDateGroups).sort().map(function (date) {
        return {
          date: date,
          className: vm.loadDateGroups[date]
        };
      });
    }

    function pad(value, size) {
      var text = String(value);
      while (text.length < size) {
        text = '0' + text;
      }
      return text;
    }

    function indexById(rows) {
      return rows.reduce(function (acc, row) {
        acc[row.id] = angular.copy(row);
        return acc;
      }, {});
    }

    function refreshFilterOptions() {
      vm.filterOptions.clients = uniqueValues('client');
      vm.filterOptions.operators = uniqueValues('operator');
      vm.filterOptions.lines = uniqueValues('line');
    }

    function uniqueValues(key) {
      return vm.bookings.map(function (row) {
        return row[key];
      }).filter(function (value, index, values) {
        return value && values.indexOf(value) === index;
      }).sort();
    }

    function onCellChange(row, field) {
      var originalRow = vm.originalBookings[row.id] || {};
      var originalValue = normalizeValue(originalRow[field.key]);
      var newValue = normalizeValue(row[field.key]);

      if (!vm.changedCells[row.id]) {
        vm.changedCells[row.id] = {};
      }

      if (originalValue !== newValue) {
        vm.changedCells[row.id][field.key] = {
          booking: row.bookingNumber,
          field: field.label,
          oldValue: originalValue,
          newValue: newValue
        };
        addAudit(row, field, originalValue, newValue);
      } else {
        delete vm.changedCells[row.id][field.key];
        if (Object.keys(vm.changedCells[row.id]).length === 0) {
          delete vm.changedCells[row.id];
        }
      }

      validateRow(row);
      refreshFilterOptions();
    }

    function addAudit(row, field, oldValue, newValue) {
      vm.auditLog.push({
        user: vm.currentUser,
        timestamp: new Date(),
        booking: row.bookingNumber,
        field: field.label,
        oldValue: oldValue || '-',
        newValue: newValue || '-'
      });
    }

    function cellClass(row, field) {
      return {
        changed: vm.changedCells[row.id] && vm.changedCells[row.id][field.key],
        invalid: vm.validationErrors[row.id] && vm.validationErrors[row.id][field.key]
      };
    }

    function validateAll() {
      vm.bookings.forEach(validateRow);
    }

    function validateRow(row) {
      var errors = {};

      if (!isValidDate(row.loadDate)) {
        errors.loadDate = 'Fecha invalida';
      }

      if (!isValidDate(row.eta)) {
        errors.eta = 'Fecha invalida';
      }

      if (row.numberingDate && !isValidDate(row.numberingDate)) {
        errors.numberingDate = 'Fecha invalida';
      }

      if (!isNumeric(row.containerQty)) {
        errors.containerQty = 'Debe ser numerico';
      }

      if (vm.equipmentSizes.indexOf(String(row.equipmentSize)) === -1) {
        errors.equipmentSize = 'Solo 20 o 40';
      }

      if (vm.validDamStatuses.indexOf(row.damStatus) === -1) {
        errors.damStatus = 'Estado no permitido';
      }

      if (vm.yesNoOptions.indexOf(row.dfSent) === -1) {
        errors.dfSent = 'Use Sí o No';
      }

      if (vm.yesNoOptions.indexOf(row.endorsementSent) === -1) {
        errors.endorsementSent = 'Use Sí o No';
      }

      if (Object.keys(errors).length > 0) {
        vm.validationErrors[row.id] = errors;
      } else {
        delete vm.validationErrors[row.id];
      }
    }

    function isValidDate(value) {
      if (!value) {
        return false;
      }
      var date = new Date(value + 'T00:00:00');
      return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(value);
    }

    function isNumeric(value) {
      return value !== null && value !== '' && !isNaN(Number(value)) && Number(value) >= 0;
    }

    function filteredBookings() {
      var rows = vm.bookings.filter(function (row) {
        return matchesText(row.bookingNumber, vm.filters.booking) &&
          matchesExact(row.client, vm.filters.client) &&
          matchesExact(row.operator, vm.filters.operator) &&
          matchesExact(row.line, vm.filters.line) &&
          matchesExact(row.damStatus, vm.filters.damStatus) &&
          matchesDateRange(row.loadDate, vm.filters.loadDateFrom, vm.filters.loadDateTo);
      });

      return sortRows(rows);
    }

    function cycleSort(field) {
      if (vm.sortState.key !== field.key) {
        vm.sortState.key = field.key;
        vm.sortState.direction = 'asc';
        return;
      }

      if (vm.sortState.direction === 'asc') {
        vm.sortState.direction = 'desc';
        return;
      }

      clearSort();
    }

    function setSortDirection(direction) {
      if (!vm.sortState.key) {
        return;
      }

      vm.sortState.direction = direction;
    }

    function clearSort() {
      vm.sortState.key = null;
      vm.sortState.direction = null;
    }

    function sortIcon(field) {
      if (vm.sortState.key !== field.key) {
        return '↕';
      }

      return vm.sortState.direction === 'asc' ? '↑' : '↓';
    }

    function activeSortLabel() {
      var field = getField(vm.sortState.key);

      if (!field) {
        return 'Sin orden aplicado';
      }

      return field.label + ' ' + (vm.sortState.direction === 'asc' ? 'ascendente' : 'descendente');
    }

    function sortRows(rows) {
      var field = getField(vm.sortState.key);

      if (!field || !vm.sortState.direction) {
        return rows;
      }

      return rows.slice().sort(function (left, right) {
        var result = compareValues(left[field.key], right[field.key], field.dataType);
        return vm.sortState.direction === 'asc' ? result : result * -1;
      });
    }

    function compareValues(left, right, dataType) {
      if (dataType === 'number') {
        return numericValue(left) - numericValue(right);
      }

      if (dataType === 'date') {
        return dateValue(left) - dateValue(right);
      }

      return String(left || '').localeCompare(String(right || ''), 'es', {
        numeric: true,
        sensitivity: 'base'
      });
    }

    function numericValue(value) {
      var number = Number(value);
      return isNaN(number) ? Number.NEGATIVE_INFINITY : number;
    }

    function dateValue(value) {
      var date = parseDate(value);
      return date ? date.getTime() : Number.NEGATIVE_INFINITY;
    }

    function moveColumn(field, direction) {
      var currentIndex = vm.fields.indexOf(field);
      var nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= vm.fields.length) {
        return;
      }

      vm.fields.splice(currentIndex, 1);
      vm.fields.splice(nextIndex, 0, field);
      persistColumnOrder();
    }

    function handleColumnDrop(sourceKey, targetKey) {
      if (!sourceKey || !targetKey || sourceKey === targetKey) {
        vm.draggedFieldKey = null;
        return;
      }

      var sourceIndex = fieldIndex(sourceKey);
      var targetIndex = fieldIndex(targetKey);

      if (sourceIndex === -1 || targetIndex === -1) {
        vm.draggedFieldKey = null;
        return;
      }

      var sourceField = vm.fields.splice(sourceIndex, 1)[0];
      var adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      vm.fields.splice(adjustedTargetIndex, 0, sourceField);
      vm.draggedFieldKey = null;
      persistColumnOrder();
    }

    function resetColumnOrder() {
      vm.fields = vm.defaultFieldOrder.map(getField).filter(Boolean);
      localStorage.removeItem(vm.columnOrderStorageKey);
    }

    function applySavedColumnOrder() {
      var storedOrder = [];

      try {
        storedOrder = JSON.parse(localStorage.getItem(vm.columnOrderStorageKey) || '[]');
      } catch (error) {
        storedOrder = [];
      }

      if (!Array.isArray(storedOrder) || storedOrder.length === 0) {
        return;
      }

      var orderedFields = storedOrder.map(getField).filter(Boolean);
      var missingFields = vm.fields.filter(function (field) {
        return storedOrder.indexOf(field.key) === -1;
      });

      if (orderedFields.length > 0) {
        vm.fields = orderedFields.concat(missingFields);
      }
    }

    function persistColumnOrder() {
      localStorage.setItem(vm.columnOrderStorageKey, JSON.stringify(vm.fields.map(function (field) {
        return field.key;
      })));
    }

    function fieldIndex(key) {
      return vm.fields.findIndex(function (field) {
        return field.key === key;
      });
    }

    function getField(key) {
      return vm.fields.find(function (field) {
        return field.key === key;
      });
    }

    function matchesText(value, search) {
      return !search || String(value || '').toLowerCase().indexOf(String(search).toLowerCase()) !== -1;
    }

    function matchesExact(value, selected) {
      return !selected || value === selected;
    }

    function matchesDateRange(value, from, to) {
      var current = parseDate(value);
      var min = parseDate(from);
      var max = parseDate(to);
      return (!min || current >= min) && (!max || current <= max);
    }

    function parseDate(value) {
      if (!value) {
        return null;
      }
      if (angular.isDate(value)) {
        return value;
      }
      var date = new Date(value + 'T00:00:00');
      return isNaN(date.getTime()) ? null : date;
    }

    function pendingChangeCount() {
      return Object.keys(vm.changedCells).reduce(function (total, rowId) {
        return total + Object.keys(vm.changedCells[rowId]).length;
      }, 0);
    }

    function errorCount() {
      return Object.keys(vm.validationErrors).reduce(function (total, rowId) {
        return total + Object.keys(vm.validationErrors[rowId]).length;
      }, 0);
    }

    function hasPendingChanges() {
      return pendingChangeCount() > 0;
    }

    function hasErrors() {
      return errorCount() > 0;
    }

    function saveChanges() {
      validateAll();

      if (hasErrors()) {
        return;
      }

      var changes = collectChanges();
      vm.saveSummary = changes;
      vm.originalBookings = indexById(vm.bookings);
      vm.changedCells = {};
    }

    function collectChanges() {
      var changes = [];
      Object.keys(vm.changedCells).forEach(function (rowId) {
        Object.keys(vm.changedCells[rowId]).forEach(function (fieldKey) {
          changes.push(angular.copy(vm.changedCells[rowId][fieldKey]));
        });
      });
      return changes;
    }

    function discardChanges() {
      vm.bookings = Object.keys(vm.originalBookings).map(function (id) {
        return angular.copy(vm.originalBookings[id]);
      });
      vm.changedCells = {};
      vm.validationErrors = {};
      vm.saveSummary = null;
      refreshFilterOptions();
      validateAll();
    }

    function exportExcel() {
      var rows = filteredBookings();
      var header = vm.fields.map(function (field) {
        return field.label;
      });
      var csvRows = [header].concat(rows.map(function (row) {
        return vm.fields.map(function (field) {
          return row[field.key];
        });
      }));

      var csv = csvRows.map(function (row) {
        return row.map(escapeCsv).join(',');
      }).join('\n');

      var blob = new Blob(['\ufeff' + csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'gestion-masiva-bookings.xls';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }

    function escapeCsv(value) {
      var text = String(value === null || value === undefined ? '' : value);
      return '"' + text.replace(/"/g, '""') + '"';
    }

    function reloadData() {
      loadData();
    }

    function closeSummary() {
      vm.saveSummary = null;
    }

    function normalizeValue(value) {
      if (angular.isDate(value)) {
        return $filter('date')(value, 'yyyy-MM-dd');
      }
      return value === null || value === undefined ? '' : String(value);
    }

    function fallbackData() {
      return [
        { id: 1, bookingNumber: 'BK-2026-0001', client: 'AGROINDUSTRIAS AIB S.A.', operator: 'Maria Quispe', line: 'ONE', vessel: 'SEASPAN LIMA', voyage: '014W', product: 'PALTAS FRESCAS', departurePort: 'CALLAO', destination: 'ROTTERDAM', loadDate: '2026-06-12', eta: '2026-07-08', week: '24', shipmentType: 'FCL', damPerContainer: 'Sí', containerQty: 2, equipmentSize: '40', containerType: 'REEFER', temperature: '-0.5 C', terminal: 'DP WORLD CALLAO', customsOffice: 'MARITIMA CALLAO', damNumber: '118-2026-10-000101', orderNumber: 'ORD-1001', numberingDate: '2026-06-10', containerNumber: 'TCLU1234567', damStatus: 'Pendiente', dfSent: 'No', endorsementSent: 'No', referenceCode: 'AIB-BK-0001' }
      ];
    }
  }
}());
