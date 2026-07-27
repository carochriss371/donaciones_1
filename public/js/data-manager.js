(function () {
  const DATA_PATH = './data/'; // O './public/data/' dependiendo de tu estructura

  async function loadData() {
    try {
      const [contabilidad, inventario, entradas, donado, metadata] = await Promise.all([
        fetch(DATA_PATH + 'contabilidad.json').then(r => r.json()).catch(() => []),
        fetch(DATA_PATH + 'inventario.json').then(r => r.json()).catch(() => []),
        fetch(DATA_PATH + 'entradas.json').then(r => r.json()).catch(() => []),
        fetch(DATA_PATH + 'donado.json').then(r => r.json()).catch(() => []),
        fetch(DATA_PATH + 'metadata.json').then(r => r.json()).catch(() => ({}))
      ]);

      return {
        contabilidad,
        inventario,
        entradas,
        donado,
        metadata
      };
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      return {
        contabilidad: [],
        inventario: [],
        entradas: [],
        donado: [],
        metadata: {}
      };
    }
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