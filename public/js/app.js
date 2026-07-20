// app.js - Con paginación - VERSION CORREGIDA
console.log('🔄 VERSIÓN FINAL - Cuentas BS unificadas | USD separada | Combos únicos');

const DATA_URL = 'data/';
const ROWS_PER_PAGE = 5;

let state = {
    contabilidad: [],
    inventario: [],
    entradas: [],
    donado: [],
    summary: null,
    lastUpdate: null
};

let pagination = {
    contabilidad: { currentPage: 1, totalPages: 1 },
    inventario: { currentPage: 1, totalPages: 1 },
    entradas: { currentPage: 1, totalPages: 1 },
    donado: { currentPage: 1, totalPages: 1 }
};

// ============================================
// CARGA DE DATOS
// ============================================

async function loadAllData() {
    console.log('🔄 Cargando datos...');
    
    try {
        const [contabilidad, inventario, entradas, donado, metadata] = await Promise.all([
            fetchJSON('contabilidad.json'),
            fetchJSON('inventario.json'),
            fetchJSON('entradas.json'),
            fetchJSON('donado.json'),
            fetchJSON('metadata.json')
        ]);

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

        // Resetear paginación
        Object.keys(pagination).forEach(key => {
            pagination[key].currentPage = 1;
        });

        renderAll();
        updateLastUpdate();

    } catch (error) {
        console.error('❌ Error cargando datos:', error);
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
// FUNCIÓN PARA FORMATEAR FECHA (DD/MM/AAAA)
// ============================================

function formatDate(fecha) {
    if (!fecha) return '-';
    
    let d;
    if (typeof fecha === 'string') {
        d = new Date(fecha);
    } else if (fecha instanceof Date) {
        d = fecha;
    } else {
        return fecha;
    }
    
    if (isNaN(d.getTime())) return fecha;
    
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    
    return `${dia}/${mes}/${anio}`;
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
}

function renderSummary() {
    const s = state.summary;
    if (!s) return;

    const bs = s.bs || {};
    const usd = s.usd || {};

    document.getElementById('totalBs').textContent = `Bs. ${formatNumber(bs.totalRecaudado || 0)}`;
    document.getElementById('totalUsd').textContent = `$ ${formatNumber(usd.totalRecaudado || 0)}`;
    document.getElementById('saldoNetoBs').textContent = `Bs. ${formatNumber(bs.saldoNeto || 0)}`;
    document.getElementById('saldoNetoUsd').textContent = `$ ${formatNumber(usd.saldoNeto || 0)}`;
    document.getElementById('totalRecaudado').textContent = `Bs. ${formatNumber(bs.totalRecaudado || 0)} | $ ${formatNumber(usd.totalRecaudado || 0)}`;
}

// ============================================
// CONTABILIDAD CON PAGINACIÓN
// ============================================

function renderContabilidad() {
    const tbody = document.getElementById('contabilidadBody');
    const rows = state.contabilidad;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        document.getElementById('contabilidadPagination').innerHTML = '';
        return;
    }

    // Aplanar todas las cuentas
    let allRows = [];
    rows.forEach(account => {
        // UNIFICAR: Cuentas BS (DAYANA y PERSONAL) se unifican como "Cuenta BS"
        let accountName = account.accountName || 'General';
        const isBsAccount = accountName.includes('DAYANA') || accountName.includes('PERSONAL');
        
        if (isBsAccount) {
            accountName = 'Cuenta BS';
        }
        
        // Si es USD, mantener el nombre con (USD)
        if (account.currency === '$') {
            accountName = 'Cuenta USD';
        }
        
        (account.rows || []).forEach(row => {
            allRows.push({
                accountName: accountName,
                currency: account.currency || 'Bs.',
                ...row
            });
        });
    });

    // Ordenar por fecha (más reciente primero)
    allRows.sort((a, b) => {
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return new Date(b.fecha) - new Date(a.fecha);
    });

    const totalPages = Math.ceil(allRows.length / ROWS_PER_PAGE);
    pagination.contabilidad.totalPages = totalPages;
    const currentPage = pagination.contabilidad.currentPage;
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const pageRows = allRows.slice(start, end);

    tbody.innerHTML = pageRows.map(row => {
        const moneda = row.currency === '$' ? '$' : 'Bs.';
        
        // INGRESO (antes Debe) y EGRESO (antes Haber)
        const ingreso = row.debe ? `${moneda} ${formatNumber(row.debe)}` : '-';
        const egreso = row.haber ? `${moneda} ${formatNumber(row.haber)}` : '-';
        const saldo = row.saldo ? `${moneda} ${formatNumber(row.saldo)}` : '-';
        
        const colorIngreso = row.debe ? 'text-primary font-medium' : 'text-on-surface-variant';
        const colorEgreso = row.haber ? 'text-error font-medium' : 'text-on-surface-variant';
        
        // Mostrar el nombre de la cuenta con su moneda si es USD
        let displayAccountName = row.accountName;
        if (row.currency === '$') {
            displayAccountName = 'Cuenta USD';
        }
        
        return `
            <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
                <td class="px-md py-md text-body-sm font-body-sm font-medium text-on-surface">${displayAccountName}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${formatDate(row.fecha)}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-on-surface max-w-xs truncate">${row.asiento || '-'}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right ${colorIngreso}">${ingreso}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right ${colorEgreso}">${egreso}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right font-medium text-on-surface">${saldo}</td>
            </tr>
        `;
    }).join('');

    renderPagination('contabilidad', totalPages);
}

// ============================================
// INVENTARIO CON PAGINACIÓN
// ============================================

function renderInventario() {
    const tbody = document.getElementById('inventarioBody');
    const rows = state.inventario;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        document.getElementById('inventarioPagination').innerHTML = '';
        return;
    }

    const sorted = [...rows].sort((a, b) => (a.stock || 0) - (b.stock || 0));

    const totalPages = Math.ceil(sorted.length / ROWS_PER_PAGE);
    pagination.inventario.totalPages = totalPages;
    const currentPage = pagination.inventario.currentPage;
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const pageRows = sorted.slice(start, end);

    tbody.innerHTML = pageRows.map(row => {
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

    renderPagination('inventario', totalPages);
}

// ============================================
// ENTRADAS CON PAGINACIÓN
// ============================================

function renderEntradas() {
    const tbody = document.getElementById('entradasBody');
    const rows = state.entradas;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        document.getElementById('entradasPagination').innerHTML = '';
        return;
    }

    const sorted = [...rows].sort((a, b) => {
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return new Date(b.fecha) - new Date(a.fecha);
    });

    const totalPages = Math.ceil(sorted.length / ROWS_PER_PAGE);
    pagination.entradas.totalPages = totalPages;
    const currentPage = pagination.entradas.currentPage;
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const pageRows = sorted.slice(start, end);

    tbody.innerHTML = pageRows.map(row => `
        <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
            <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${formatDate(row.fecha)}</td>
            <td class="px-md py-md text-body-sm font-body-sm font-medium text-on-surface">${row.producto || 'Sin nombre'}</td>
            <td class="px-md py-md text-body-sm font-body-sm text-right text-secondary font-medium">+${formatNumber(row.cantidad || 0)}</td>
        </tr>
    `).join('');

    renderPagination('entradas', totalPages);
}

// ============================================
// DONADO CON PAGINACIÓN
// ============================================

function renderDonado() {
    const tbody = document.getElementById('donadoBody');
    const rows = state.donado;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        document.getElementById('donadoPagination').innerHTML = '';
        return;
    }

    const sorted = [...rows].sort((a, b) => {
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return new Date(b.fecha) - new Date(a.fecha);
    });

    const totalPages = Math.ceil(sorted.length / ROWS_PER_PAGE);
    pagination.donado.totalPages = totalPages;
    const currentPage = pagination.donado.currentPage;
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const pageRows = sorted.slice(start, end);

    tbody.innerHTML = pageRows.map(row => `
        <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
            <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${formatDate(row.fecha)}</td>
            <td class="px-md py-md text-body-sm font-body-sm font-medium text-on-surface">${row.producto || 'Sin nombre'}</td>
            <td class="px-md py-md text-body-sm font-body-sm text-right text-on-surface">${formatNumber(row.cantidad || 0)}</td>
            <td class="px-md py-md text-body-sm font-body-sm text-on-surface max-w-xs truncate">${row.centro || '-'}</td>
            <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${row.combo || '-'}</td>
        </tr>
    `).join('');

    renderPagination('donado', totalPages);
}

// ============================================
// IMPACTO - CORREGIDO: Combos ÚNICOS
// ============================================

function renderImpacto() {
    // CORRECCIÓN: Contar combos ÚNICOS por su número
    const combosUnicos = new Set();
    state.donado.forEach(d => {
        if (d.combo && d.combo.trim() !== '') {
            combosUnicos.add(d.combo);
        }
    });
    document.getElementById('combosEntregados').textContent = combosUnicos.size;
    
    // Total de productos donados (suma de cantidades)
    const totalDonado = state.donado.reduce((sum, d) => sum + (parseInt(d.cantidad) || 0), 0);
    document.getElementById('productosDonados').textContent = totalDonado;
    
    console.log(`📦 Combos únicos: ${combosUnicos.size}`);
    console.log(`📦 Combos encontrados: ${Array.from(combosUnicos).join(', ')}`);
}

// ============================================
// CONTADORES
// ============================================

function updateCounts() {
    document.getElementById('contabilidadCount').textContent = `${state.contabilidad.length} cuentas`;
    document.getElementById('inventarioCount').textContent = `${state.inventario.length} productos`;
    document.getElementById('entradasCount').textContent = `${state.entradas.length} registros`;
    document.getElementById('donadoCount').textContent = `${state.donado.length} registros`;
}

function updateLastUpdate() {
    const el = document.getElementById('lastUpdate');
    if (!el) return;
    
    if (state.lastUpdate) {
        const date = new Date(state.lastUpdate);
        el.textContent = `Última actualización: ${formatDate(date)}`;
    } else {
        el.textContent = 'Actualizando...';
    }
}

// ============================================
// PAGINACIÓN
// ============================================

function renderPagination(section, totalPages) {
    const container = document.getElementById(`${section}Pagination`);
    if (!container) return;

    const currentPage = pagination[section].currentPage;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `<span class="pagination-info">Página ${currentPage} de ${totalPages}</span>`;
    
    html += `<button class="pagination-btn" onclick="goToPage('${section}', ${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>‹</button>`;

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="goToPage('${section}', 1)">1</button>`;
        if (startPage > 2) html += `<span class="pagination-info">…</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage('${section}', ${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="pagination-info">…</span>`;
        html += `<button class="pagination-btn" onclick="goToPage('${section}', ${totalPages})">${totalPages}</button>`;
    }

    html += `<button class="pagination-btn" onclick="goToPage('${section}', ${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>›</button>`;

    container.innerHTML = html;
}

function goToPage(section, page) {
    const totalPages = pagination[section].totalPages;
    if (page < 1 || page > totalPages) return;
    pagination[section].currentPage = page;
    
    switch(section) {
        case 'contabilidad': renderContabilidad(); break;
        case 'inventario': renderInventario(); break;
        case 'entradas': renderEntradas(); break;
        case 'donado': renderDonado(); break;
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
setInterval(loadAllData, 300000);

window.goToPage = goToPage;