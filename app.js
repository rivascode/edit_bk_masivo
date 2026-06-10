(function () {
  'use strict';

  angular
    .module('bookingBulkApp', [])
    .controller('BookingBulkController', BookingBulkController);

  BookingBulkController.$inject = ['$http', '$filter'];

  function BookingBulkController($http, $filter) {
    var vm = this;

    vm.currentUser = 'demo.operaciones@iturri.local';
    vm.validDamStatuses = ['Pendiente', 'Numerado', 'Observado', 'Enviado'];
    vm.yesNoOptions = ['Sí', 'No'];
    vm.equipmentSizes = ['20', '40'];
    vm.shippingTypes = ['FCL', 'LCL', 'AEREO'];
    vm.containerTypes = ['REEFER', 'DRY', 'HIGH CUBE', 'OPEN TOP'];

    vm.fields = [
      { key: 'bookingNumber', label: 'N° Booking' },
      { key: 'client', label: 'Cliente' },
      { key: 'operator', label: 'Operador' },
      { key: 'line', label: 'Línea' },
      { key: 'vessel', label: 'Nave' },
      { key: 'voyage', label: 'Viaje' },
      { key: 'product', label: 'Producto' },
      { key: 'departurePort', label: 'Puerto de salida' },
      { key: 'destination', label: 'Destino' },
      { key: 'loadDate', label: 'Fecha de carga', inputType: 'text' },
      { key: 'eta', label: 'ETA', inputType: 'text' },
      { key: 'week', label: 'Semana' },
      { key: 'shipmentType', label: 'Tipo de embarque', type: 'select', options: vm.shippingTypes },
      { key: 'damPerContainer', label: 'DAM por contenedor', type: 'select', options: vm.yesNoOptions },
      { key: 'containerQty', label: 'Cantidad de contenedores', inputType: 'number', min: '0' },
      { key: 'equipmentSize', label: 'Equipment Size', type: 'select', options: vm.equipmentSizes },
      { key: 'containerType', label: 'Tipo contenedor', type: 'select', options: vm.containerTypes },
      { key: 'temperature', label: 'Temperatura' },
      { key: 'terminal', label: 'Terminal de embarque' },
      { key: 'customsOffice', label: 'Aduana de salida' },
      { key: 'damNumber', label: 'N° DAM' },
      { key: 'orderNumber', label: 'N° Orden' },
      { key: 'numberingDate', label: 'Fecha numeración', inputType: 'text' },
      { key: 'containerNumber', label: 'N° Contenedor' },
      { key: 'damStatus', label: 'Estado DAM', type: 'select', options: vm.validDamStatuses },
      { key: 'dfSent', label: 'D.F Enviado', type: 'select', options: vm.yesNoOptions },
      { key: 'endorsementSent', label: 'Refrendo Enviado', type: 'select', options: vm.yesNoOptions },
      { key: 'referenceCode', label: 'Código asunto / referencia' }
    ];

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
    vm.pendingChangeCount = pendingChangeCount;
    vm.errorCount = errorCount;
    vm.hasPendingChanges = hasPendingChanges;
    vm.hasErrors = hasErrors;
    vm.saveChanges = saveChanges;
    vm.discardChanges = discardChanges;
    vm.exportExcel = exportExcel;
    vm.reloadData = reloadData;
    vm.closeSummary = closeSummary;

    loadData();

    function loadData() {
      $http.get('data.json', { cache: false }).then(function (response) {
        setData(response.data);
      }, function () {
        setData(fallbackData());
      });
    }

    function setData(data) {
      vm.bookings = angular.copy(data);
      vm.originalBookings = indexById(data);
      vm.changedCells = {};
      vm.validationErrors = {};
      vm.auditLog = [];
      vm.saveSummary = null;
      refreshFilterOptions();
      validateAll();
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
      return vm.bookings.filter(function (row) {
        return matchesText(row.bookingNumber, vm.filters.booking) &&
          matchesExact(row.client, vm.filters.client) &&
          matchesExact(row.operator, vm.filters.operator) &&
          matchesExact(row.line, vm.filters.line) &&
          matchesExact(row.damStatus, vm.filters.damStatus) &&
          matchesDateRange(row.loadDate, vm.filters.loadDateFrom, vm.filters.loadDateTo);
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
