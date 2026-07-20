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

        // Cargar archivos
        const [contabilidad, inventario, entradas, donado, metadata] = await Promise.all([
            fetchJSON('contabilidad.json'),
            fetchJSON('inventario.json'),
            fetchJSON('entradas.json'),
            fetchJSON('donado.json'),
            fetchJSON('metadata.json')
        ]);

        state.contabilidad = contabilidad || [];
        state.inventario = inventario || [];
        state.entradas = entradas || [];
        state.donado = donado || [];
        state.summary = metadata?.summary || null;
        state.lastUpdate = metadata?.timestamp || null;

        console.log('✅ Datos cargados correctamente');
        console.log(`📊 Contabilidad: ${state.contabilidad.length}`);
        console.log(`📦 Inventario: ${state.inventario.length}`);
        console.log(`📥 Entradas: ${state.entradas.length}`);
        console.log(`🤝 Donado: ${state.donado.length}`);

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
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.warn(`⚠️ ${filename}:`, error.message);
        return null;
    }
}

// ============================================
// RENDERIZADO
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
    if (!s) return;

    const bs = s.bs || {};
    const usd = s.usd || {};

    document.getElementById('totalBs').textContent = `Bs. ${formatNumber(bs.totalRecaudado || 0)}`;
    document.getElementById('totalUsd').textContent = `$ ${formatNumber(usd.totalRecaudado || 0)}`;
    document.getElementById('saldoNetoBs').textContent = `Bs. ${formatNumber(bs.saldoNeto || 0)}`;
    document.getElementById('totalRecaudado').textContent = `Bs. ${formatNumber(bs.totalRecaudado || 0)} | $ ${formatNumber(usd.totalRecaudado || 0)}`;
}

function renderContabilidad() {
    const tbody = document.getElementById('contabilidadBody');
    const rows = state.contabilidad;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }

    // Aplanar todas las cuentas
    let allRows = [];
    rows.forEach(account => {
        (account.rows || []).forEach(row => {
            allRows.push({
                accountName: account.accountName || 'General',
                currency: account.currency || 'Bs.',
                ...row
            });
        });
    });

    // Mostrar últimos 50 registros
    const displayRows = allRows.length > 50 ? allRows.slice(-50).reverse() : allRows.reverse();

    tbody.innerHTML = displayRows.map(row => {
        const moneda = row.currency === '$' ? '$' : 'Bs.';
        return `
            <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
                <td class="px-md py-md text-body-sm font-body-sm font-medium text-on-surface">${row.accountName}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${row.fecha || '-'}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-on-surface max-w-xs truncate">${row.asiento || '-'}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right ${row.debe ? 'text-primary font-medium' : 'text-on-surface-variant'}">${row.debe ? `${moneda} ${formatNumber(row.debe)}` : '-'}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right ${row.haber ? 'text-error font-medium' : 'text-on-surface-variant'}">${row.haber ? `${moneda} ${formatNumber(row.haber)}` : '-'}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right font-medium text-on-surface">${row.saldo ? `${moneda} ${formatNumber(row.saldo)}` : '-'}</td>
            </tr>
        `;
    }).join('');
}

function renderInventario() {
    const tbody = document.getElementById('inventarioBody');
    const rows = state.inventario;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }

    const sorted = [...rows].sort((a, b) => (a.stock || 0) - (b.stock || 0));

    tbody.innerHTML = sorted.map(row => {
        const stock = row.stock || 0;
        const isLow = stock < 5;
        const badgeClass = isLow ? 'stock-low' : 'stock-normal';
        const badgeText = isLow ? '⚠️ Stock bajo' : '✓ Disponible';
        
        return `
            <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
                <td class="px-md py-md text-body-sm font-body-sm font-mono text-on-surface">${row.cod || '-'}</td>
                <td class="px-md py-md text-body-sm font-body-sm font-medium text-on-surface">${row.producto || 'Sin nombre'}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right text-on-surface">${formatNumber(row.entradas || 0)}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right text-on-surface">${formatNumber(row.salidas || 0)}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right">
                    <span class="${badgeClass}">${formatNumber(stock)} ${badgeText}</span>
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

    const displayRows = rows.length > 50 ? rows.slice(-50).reverse() : rows.reverse();

    tbody.innerHTML = displayRows.map(row => `
        <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
            <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${row.fecha || '-'}</td>
            <td class="px-md py-md text-body-sm font-body-sm font-medium text-on-surface">${row.producto || 'Sin nombre'}</td>
            <td class="px-md py-md text-body-sm font-body-sm text-right text-secondary font-medium">+${formatNumber(row.cantidad || 0)}</td>
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

    const displayRows = rows.length > 50 ? rows.slice(-50).reverse() : rows.reverse();

    tbody.innerHTML = displayRows.map(row => `
        <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
            <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${row.fecha || '-'}</td>
            <td class="px-md py-md text-body-sm font-body-sm font-medium text-on-surface">${row.producto || 'Sin nombre'}</td>
            <td class="px-md py-md text-body-sm font-body-sm text-right text-on-surface">${formatNumber(row.cantidad || 0)}</td>
            <td class="px-md py-md text-body-sm font-body-sm text-on-surface max-w-xs truncate">${row.centro || '-'}</td>
            <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${row.combo || '-'}</td>
        </tr>
    `).join('');
}

function renderImpacto() {
    const combos = state.donado.filter(d => d.combo).length;
    document.getElementById('combosEntregados').textContent = combos;
    
    const totalDonado = state.donado.reduce((sum, d) => sum + (parseInt(d.cantidad) || 0), 0);
    document.getElementById('productosDonados').textContent = totalDonado;
}

function updateCounts() {
    document.getElementById('contabilidadCount').textContent = `${state.contabilidad.length} cuentas`;
    document.getElementById('inventarioCount').textContent = `${state.inventario.length} productos`;
    document.getElementById('entradasCount').textContent = `${state.entradas.length} registros`;
    document.getElementById('donadoCount').textContent = `${state.donado.length} registros`;
}

function updateLastUpdate() {
    const el = document.getElementById('lastUpdate');
    if (state.lastUpdate) {
        const date = new Date(state.lastUpdate);
        el.textContent = `Última actualización: ${date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
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
    // No hace falta mostrar skeletons, solo se actualiza con los datos
}

function showError() {
    document.querySelectorAll('tbody').forEach(el => {
        if (el.id) {
            const colCount = el.closest('table')?.querySelector('thead tr')?.children?.length || 3;
            el.innerHTML = `<tr><td colspan="${colCount}" class="px-md py-md text-center text-error">❌ Error al cargar los datos. Recarga la página.</td></tr>`;
        }
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', loadAllData);

// Recargar cada 5 minutos
setInterval(loadAllData, 300000);