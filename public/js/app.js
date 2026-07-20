// app.js - Carga y renderiza los datos

const DATA_URL = 'data/';

let state = {
    contabilidad: [],
    inventario: [],
    entradas: [],
    donado: [],
    summary: null,
    lastUpdate: null
};

// ============================================
// CARGA DE DATOS
// ============================================

async function loadAllData() {
    console.log('🔄 Cargando datos...');
    
    try {
        // Mostrar estado de carga
        setLoadingState(true);

        // Cargar archivos en paralelo
        const [contabilidad, inventario, entradas, donado, metadata] = await Promise.all([
            fetchJSON('contabilidad.json'),
            fetchJSON('inventario.json'),
            fetchJSON('entradas.json'),
            fetchJSON('donado.json'),
            fetchJSON('metadata.json')
        ]);

        // Asignar datos (con valores por defecto)
        state.contabilidad = Array.isArray(contabilidad) ? contabilidad : [];
        state.inventario = Array.isArray(inventario) ? inventario : [];
        state.entradas = Array.isArray(entradas) ? entradas : [];
        state.donado = Array.isArray(donado) ? donado : [];
        state.summary = metadata?.summary || null;
        state.lastUpdate = metadata?.timestamp || null;

        console.log('✅ Datos cargados correctamente');
        console.log(`📊 Contabilidad: ${state.contabilidad.length}`);
        console.log(`📦 Inventario: ${state.inventario.length}`);
        console.log(`📥 Entradas: ${state.entradas.length}`);
        console.log(`🤝 Donado: ${state.donado.length}`);

        // Renderizar
        renderAll();
        setLoadingState(false);

    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        setLoadingState(false);
        showError();
    }
}

async function fetchJSON(filename) {
    try {
        const response = await fetch(DATA_URL + filename);
        if (!response.ok) {
            console.warn(`⚠️ ${filename} no encontrado (${response.status})`);
            return null;
        }
        const data = await response.json();
        console.log(`✅ ${filename} cargado: ${Array.isArray(data) ? data.length : 'objeto'}`);
        return data;
    } catch (error) {
        console.warn(`⚠️ Error cargando ${filename}:`, error.message);
        return null;
    }
}

// ============================================
// RENDERIZADO (con el diseño original)
// ============================================

function renderAll() {
    renderSummary();
    renderContabilidad();
    renderInventario();
    renderEntradas();
    renderDonado();
    renderImpacto();
    updateCounts();
    updateLastUpdate();
}

function renderSummary() {
    const s = state.summary;
    if (!s) {
        document.getElementById('totalRecaudado').textContent = 'Cargando...';
        return;
    }

    const bs = s.bs || {};
    const usd = s.usd || {};

    // Actualizar las tarjetas
    document.getElementById('totalRecaudado').textContent = `Bs. ${formatNumber(bs.totalRecaudado || 0)} | $ ${formatNumber(usd.totalRecaudado || 0)}`;
    document.getElementById('totalRecaudadoCard').textContent = `Bs. ${formatNumber(bs.totalRecaudado || 0)}`;
    document.getElementById('totalEjecutadoCard').textContent = `Bs. ${formatNumber(bs.totalEjecutado || 0)}`;
    document.getElementById('saldoNetoCard').textContent = `Bs. ${formatNumber(bs.saldoNeto || 0)}`;
    
    // Barra de progreso
    const progress = bs.totalRecaudado > 0 ? Math.min((bs.totalEjecutado / bs.totalRecaudado) * 100, 100) : 0;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${Math.round(progress)}% Meta`;
}

function renderContabilidad() {
    const tbody = document.getElementById('contabilidadBody');
    const rows = state.contabilidad;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }

    // Aplanar todas las cuentas
    let allRows = [];
    rows.forEach(account => {
        (account.rows || []).forEach(row => {
            allRows.push({
                ...row,
                accountName: account.accountName || 'General',
                currency: account.currency || 'Bs.'
            });
        });
    });

    // Mostrar últimos 10 registros
    const displayRows = allRows.slice(-10).reverse();

    tbody.innerHTML = displayRows.map(row => {
        const monto = row.debe ? `+$${formatNumber(row.debe)}` : row.haber ? `-$${formatNumber(row.haber)}` : '$0';
        const isIncome = row.debe && !row.haber;
        const colorClass = isIncome ? 'text-secondary' : 'text-error';
        const currency = row.currency === '$' ? '$' : 'Bs.';
        
        return `
            <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
                <td class="px-md py-md text-tabular-nums font-tabular-nums text-on-surface">${row.fecha || '-'}</td>
                <td class="px-md py-md text-body-md font-body-md">${row.asiento || row.accountName || '-'}</td>
                <td class="px-md py-md text-tabular-nums font-tabular-nums ${colorClass} font-semibold">${currency} ${monto}</td>
                <td class="px-md py-md text-right">
                    <span class="text-on-surface-variant text-label-bold font-label-bold">${currency} ${formatNumber(row.saldo || 0)}</span>
                </td>
            </tr>
        `;
    }).join('');
}

function renderInventario() {
    const tbody = document.getElementById('inventarioBody');
    const rows = state.inventario;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.slice(0, 20).map(item => {
        const stock = (item.entradas || 0) - (item.salidas || 0);
        const isLow = stock < 5;
        const badgeClass = isLow ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container';
        
        return `
            <tr class="hover:bg-surface-container-lowest fade-in">
                <td class="px-md py-md text-body-md font-body-md font-medium">${item.cod || 'N/A'} (${item.producto || 'Sin nombre'})</td>
                <td class="px-md py-md text-tabular-nums">${item.entradas || 0}</td>
                <td class="px-md py-md text-tabular-nums">${item.salidas || 0}</td>
                <td class="px-md py-md">
                    <span class="${badgeClass} px-sm py-xs rounded-full text-label-bold font-label-bold">${stock} Unidades</span>
                </td>
            </tr>
        `;
    }).join('');
}

function renderEntradas() {
    const tbody = document.getElementById('entradasBody');
    const rows = state.entradas;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }

    const displayRows = rows.slice(-10).reverse();

    tbody.innerHTML = displayRows.map(e => `
        <tr class="hover:bg-surface-container-lowest fade-in">
            <td class="px-md py-md text-tabular-nums">${e.fecha || '-'}</td>
            <td class="px-md py-md font-medium">${e.cod || 'N/A'} (${e.producto || 'Sin nombre'})</td>
            <td class="px-md py-md text-tabular-nums text-secondary font-semibold">+${e.cantidad || 0}</td>
        </tr>
    `).join('');
}

function renderDonado() {
    const tbody = document.getElementById('donadoBody');
    const rows = state.donado;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }

    const displayRows = rows.slice(-10).reverse();

    tbody.innerHTML = displayRows.map(item => `
        <tr class="hover:bg-surface-container-lowest fade-in">
            <td class="px-md py-md text-tabular-nums">${item.fecha || '-'}</td>
            <td class="px-md py-md font-medium">${item.cod || 'N/A'} (${item.producto || 'Sin nombre'})</td>
            <td class="px-md py-md text-tabular-nums">${item.cantidad || 0}</td>
            <td class="px-md py-md">${item.centro || '-'}</td>
            <td class="px-md py-md text-tabular-nums">${item.combo || '-'}</td>
        </tr>
    `).join('');
}

function renderImpacto() {
    // Calcular combos entregados (de donado)
    const combos = state.donado.filter(d => d.combo).length;
    document.getElementById('combosEntregados').textContent = combos;
    
    // Calcular productos donados
    const totalDonado = state.donado.reduce((sum, d) => sum + (parseInt(d.cantidad) || 0), 0);
    document.getElementById('productosDonados').textContent = totalDonado;
}

function updateCounts() {
    // Actualizar contadores si existen
    const contabilidadEl = document.getElementById('contabilidadCount');
    if (contabilidadEl) contabilidadEl.textContent = `${state.contabilidad.length} cuentas`;
    
    const inventarioEl = document.getElementById('inventarioCount');
    if (inventarioEl) inventarioEl.textContent = `${state.inventario.length} productos`;
    
    const entradasEl = document.getElementById('entradasCount');
    if (entradasEl) entradasEl.textContent = `${state.entradas.length} registros`;
    
    const donadoEl = document.getElementById('donadoCount');
    if (donadoEl) donadoEl.textContent = `${state.donado.length} registros`;
}

function updateLastUpdate() {
    const el = document.getElementById('lastUpdate');
    if (!el) return;
    
    if (state.lastUpdate) {
        const date = new Date(state.lastUpdate);
        const dateStr = date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        el.textContent = `Última actualización: ${dateStr}`;
    } else {
        el.textContent = 'Actualizando...';
    }
}

// ============================================
// UTILIDADES
// ============================================

function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('es-VE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function setLoadingState(loading) {
    // No es necesario mostrar skeletons
}

function showError() {
    document.querySelectorAll('tbody').forEach(el => {
        if (el.id) {
            const colCount = el.closest('table')?.querySelector('thead tr')?.children?.length || 3;
            el.innerHTML = `<tr><td colspan="${colCount}" class="px-md py-md text-center text-error">❌ Error al cargar los datos</td></tr>`;
        }
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', loadAllData);

// Recargar cada 5 minutos
setInterval(loadAllData, 300000);