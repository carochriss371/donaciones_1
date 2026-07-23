// app.js - Con paginación - VERSION CON TABLAS SEPARADAS Y PAGINACIÓN CORREGIDA
console.log('🔄 VERSIÓN FINAL - Tablas separadas BS y USD - Paginación corregida');

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
    contabilidadBS: { currentPage: 1, totalPages: 1 },
    contabilidadUSD: { currentPage: 1, totalPages: 1 },
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
    renderContabilidadBS();
    renderContabilidadUSD();
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
    
    const saldoRealBs = calcularSaldoReal('Bs.');
    const saldoRealUsd = calcularSaldoReal('$');
    
    document.getElementById('saldoNetoBs').textContent = `Bs. ${formatNumber(saldoRealBs)}`;
    document.getElementById('saldoNetoUsd').textContent = `$ ${formatNumber(saldoRealUsd)}`;
    document.getElementById('totalRecaudado').textContent = `Bs. ${formatNumber(bs.totalRecaudado || 0)} | $ ${formatNumber(usd.totalRecaudado || 0)}`;
}

function calcularSaldoReal(moneda) {
    let saldo = 0;
    
    state.contabilidad.forEach(account => {
        if (account.currency === moneda) {
            (account.rows || []).forEach(row => {
                if (row.debe) saldo += row.debe;
                if (row.haber) saldo -= row.haber;
            });
        }
    });
    
    return saldo;
}

// ============================================
// CONTABILIDAD - CUENTA BS
// ============================================

function renderContabilidadBS() {
    const tbody = document.getElementById('contabilidadBodyBS');
    const rows = state.contabilidad;
    
    const cuentasBS = rows.filter(account => account.currency === 'Bs.');
    
    if (!cuentasBS || cuentasBS.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        document.getElementById('contabilidadPaginationBS').innerHTML = '';
        return;
    }

    let allRows = [];
    cuentasBS.forEach(account => {
        (account.rows || []).forEach(row => {
            allRows.push({
                accountName: 'Cuenta BS',
                currency: 'Bs.',
                numeroFactura: row.numeroFactura || null,
                ...row
            });
        });
    });

    allRows.sort((a, b) => {
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return new Date(b.fecha) - new Date(a.fecha);
    });

    const totalPages = Math.ceil(allRows.length / ROWS_PER_PAGE);
    pagination.contabilidadBS.totalPages = totalPages;
    const currentPage = pagination.contabilidadBS.currentPage;
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const pageRows = allRows.slice(start, end);

    tbody.innerHTML = pageRows.map(row => {
        const moneda = 'Bs.';
        const ingreso = row.debe ? `${moneda} ${formatNumber(row.debe)}` : '-';
        const egreso = row.haber ? `${moneda} ${formatNumber(row.haber)}` : '-';
        const saldo = row.saldo ? `${moneda} ${formatNumber(row.saldo)}` : '-';
        const colorIngreso = row.debe ? 'text-primary font-medium' : 'text-on-surface-variant';
        const colorEgreso = row.haber ? 'text-error font-medium' : 'text-on-surface-variant';
        
        let facturaBtn = '';
        if (row.numeroFactura) {
            facturaBtn = `<button class="btn-factura" onclick="verFactura('${row.numeroFactura}')">
                <span class="material-symbols-outlined" style="font-size: 14px;">receipt</span> Factura
            </button>`;
        }
        
        return `
            <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
                <td class="px-md py-md text-body-sm font-body-sm font-medium text-on-surface">${row.accountName}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${formatDate(row.fecha)}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-on-surface max-w-xs truncate">${row.asiento || '-'}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right ${colorIngreso}">${ingreso}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right ${colorEgreso}">${egreso}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right font-medium text-on-surface">${saldo}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-center">${facturaBtn}</td>
            </tr>
        `;
    }).join('');

    renderPagination('contabilidadBS', totalPages);
}

// ============================================
// CONTABILIDAD - CUENTA USD
// ============================================

function renderContabilidadUSD() {
    const tbody = document.getElementById('contabilidadBodyUSD');
    const rows = state.contabilidad;
    
    const cuentasUSD = rows.filter(account => account.currency === '$');
    
    if (!cuentasUSD || cuentasUSD.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        document.getElementById('contabilidadPaginationUSD').innerHTML = '';
        return;
    }

    let allRows = [];
    cuentasUSD.forEach(account => {
        (account.rows || []).forEach(row => {
            allRows.push({
                accountName: 'Cuenta USD',
                currency: '$',
                numeroFactura: row.numeroFactura || null,
                ...row
            });
        });
    });

    allRows.sort((a, b) => {
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return new Date(b.fecha) - new Date(a.fecha);
    });

    const totalPages = Math.ceil(allRows.length / ROWS_PER_PAGE);
    pagination.contabilidadUSD.totalPages = totalPages;
    const currentPage = pagination.contabilidadUSD.currentPage;
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const pageRows = allRows.slice(start, end);

    tbody.innerHTML = pageRows.map(row => {
        const moneda = '$';
        const ingreso = row.debe ? `${moneda} ${formatNumber(row.debe)}` : '-';
        const egreso = row.haber ? `${moneda} ${formatNumber(row.haber)}` : '-';
        const saldo = row.saldo ? `${moneda} ${formatNumber(row.saldo)}` : '-';
        const colorIngreso = row.debe ? 'text-primary font-medium' : 'text-on-surface-variant';
        const colorEgreso = row.haber ? 'text-error font-medium' : 'text-on-surface-variant';
        
        let facturaBtn = '';
        if (row.numeroFactura) {
            facturaBtn = `<button class="btn-factura" onclick="verFactura('${row.numeroFactura}')">
                <span class="material-symbols-outlined" style="font-size: 14px;">receipt</span> Factura
            </button>`;
        }
        
        return `
            <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
                <td class="px-md py-md text-body-sm font-body-sm font-medium text-on-surface">${row.accountName}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${formatDate(row.fecha)}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-on-surface max-w-xs truncate">${row.asiento || '-'}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right ${colorIngreso}">${ingreso}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right ${colorEgreso}">${egreso}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right font-medium text-on-surface">${saldo}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-center">${facturaBtn}</td>
            </tr>
        `;
    }).join('');

    renderPagination('contabilidadUSD', totalPages);
}

// ============================================
// INVENTARIO
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
// ENTRADAS
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
// DONADO
// ============================================

function renderDonado() {
    const tbody = document.getElementById('donadoBody');
    const rows = state.donado;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
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

    tbody.innerHTML = pageRows.map(row => {
        let evidenciaBtn = '';
        if (row.combo) {
            evidenciaBtn = `<button class="btn-evidencia" onclick="verEvidencia('${row.combo}')">
                <span class="material-symbols-outlined" style="font-size: 14px;">visibility</span> Evidencia
            </button>`;
        }
        
        return `
            <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
                <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${formatDate(row.fecha)}</td>
                <td class="px-md py-md text-body-sm font-body-sm font-medium text-on-surface">${row.producto || 'Sin nombre'}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-right text-on-surface">${formatNumber(row.cantidad || 0)}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-on-surface max-w-xs truncate">${row.centro || '-'}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${row.combo || '-'}</td>
                <td class="px-md py-md text-body-sm font-body-sm text-center">${evidenciaBtn}</td>
            </tr>
        `;
    }).join('');

    renderPagination('donado', totalPages);
}

// ============================================
// IMPACTO
// ============================================

function renderImpacto() {
    const combosUnicos = new Set();
    state.donado.forEach(d => {
        if (d.combo && d.combo.trim() !== '') {
            combosUnicos.add(d.combo);
        }
    });
    document.getElementById('combosEntregados').textContent = combosUnicos.size;
    
    const totalDonado = state.donado.reduce((sum, d) => sum + (parseInt(d.cantidad) || 0), 0);
    document.getElementById('productosDonados').textContent = totalDonado;
}

// ============================================
// CONTADORES
// ============================================

function updateCounts() {
    const cuentasBS = state.contabilidad.filter(a => a.currency === 'Bs.');
    const cuentasUSD = state.contabilidad.filter(a => a.currency === '$');
    
    document.getElementById('contabilidadCountBS').textContent = `${cuentasBS.length} cuentas`;
    document.getElementById('contabilidadCountUSD').textContent = `${cuentasUSD.length} cuentas`;
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
// EVIDENCIA Y FACTURAS
// ============================================

const evidenciaImagenes = {
    // '1': ['img/combos/combo1/foto1.jpg', 'img/combos/combo1/foto2.jpg'],
};

const facturaImagenes = {
    '1': 'img/facturas/Factura_1.jpg',
};

function verEvidencia(combo) {
    const modal = document.getElementById('evidenciaModal');
    const titulo = document.getElementById('evidenciaModalTitulo');
    const galeria = document.getElementById('evidenciaGaleria');
    
    titulo.textContent = `Evidencia - Combo ${combo}`;
    
    const imagenes = evidenciaImagenes[combo] || [];
    
    if (imagenes.length === 0) {
        galeria.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #727784; grid-column: 1 / -1;">
                <span class="material-symbols-outlined" style="font-size: 48px;">image_not_supported</span>
                <p style="margin-top: 12px;">No hay imágenes disponibles para el combo ${combo}</p>
            </div>
        `;
    } else {
        galeria.innerHTML = imagenes.map(img => `
            <div style="border-radius: 8px; overflow: hidden; border: 1px solid #e6eff8;">
                <img src="${img}" alt="Evidencia Combo ${combo}" style="width: 100%; height: 200px; object-fit: cover; cursor: pointer;" onclick="window.open('${img}', '_blank')">
            </div>
        `).join('');
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function verFactura(numeroFactura) {
    const modal = document.getElementById('facturaModal');
    const titulo = document.getElementById('facturaModalTitulo');
    const imagen = document.getElementById('facturaImagen');
    
    titulo.textContent = `Factura - ${numeroFactura}`;
    
    const imgSrc = facturaImagenes[numeroFactura] || null;
    
    if (imgSrc) {
        imagen.src = imgSrc;
        imagen.style.display = 'block';
        imagen.alt = `Factura ${numeroFactura}`;
        const msg = document.querySelector('#facturaModalBody .no-disponible');
        if (msg) msg.remove();
    } else {
        imagen.style.display = 'none';
        const existingMsg = document.querySelector('#facturaModalBody .no-disponible');
        if (!existingMsg) {
            const msg = document.createElement('div');
            msg.className = 'no-disponible';
            msg.style.cssText = 'text-align: center; padding: 40px; color: #727784;';
            msg.innerHTML = `
                <span class="material-symbols-outlined" style="font-size: 48px;">receipt_long</span>
                <p style="margin-top: 12px;">No hay factura disponible para ${numeroFactura}</p>
            `;
            document.getElementById('facturaModalBody').appendChild(msg);
        }
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarFacturaModal() {
    document.getElementById('facturaModal').classList.remove('active');
    document.body.style.overflow = '';
    const msg = document.querySelector('#facturaModalBody .no-disponible');
    if (msg) msg.remove();
    const img = document.getElementById('facturaImagen');
    img.style.display = 'block';
}

function cerrarEvidenciaModal() {
    document.getElementById('evidenciaModal').classList.remove('active');
    document.body.style.overflow = '';
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
        case 'contabilidadBS': renderContabilidadBS(); break;
        case 'contabilidadUSD': renderContabilidadUSD(); break;
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
        minimumFractionDigits: 2,
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

document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    
    document.getElementById('facturaModalClose').addEventListener('click', cerrarFacturaModal);
    document.getElementById('evidenciaModalClose').addEventListener('click', cerrarEvidenciaModal);
    
    document.getElementById('facturaModal').addEventListener('click', function(e) {
        if (e.target === this) cerrarFacturaModal();
    });
    document.getElementById('evidenciaModal').addEventListener('click', function(e) {
        if (e.target === this) cerrarEvidenciaModal();
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarFacturaModal();
            cerrarEvidenciaModal();
        }
    });
});

setInterval(loadAllData, 300000);

window.goToPage = goToPage;
window.verEvidencia = verEvidencia;
window.verFactura = verFactura;
window.cerrarFacturaModal = cerrarFacturaModal;
window.cerrarEvidenciaModal = cerrarEvidenciaModal;