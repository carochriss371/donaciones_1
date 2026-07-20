(function () {
  async function loadData() {
    const [contabilidad, inventario, donado] = await Promise.all([
      fetch('./data/contabilidad.json').then((response) => response.json()),
      fetch('./data/inventario.json').then((response) => response.json()),
      fetch('./data/donado.json').then((response) => response.json())
    ]);

    return {
      contabilidad,
      inventario,
      donado
    };
  }

  function formatCurrency(value) {
    if (value === null || value === undefined || value === '') return '—';
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      maximumFractionDigits: 0
    }).format(value);
  }

  function formatNumber(value) {
    if (value === null || value === undefined || value === '') return '—';
    return new Intl.NumberFormat('es-VE').format(value);
  }

  window.DonacionesDataManager = {
    loadData,
    formatCurrency,
    formatNumber
  };
})();
