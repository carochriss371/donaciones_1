// app.js - Con scroll en lugar de paginación y evidencias mejoradas
console.log('🔄 VERSIÓN FINAL - Scroll en tablas | Evidencias mejoradas');

const DATA_URL = 'data/';
const ROWS_PER_PAGE = 5; // Ya no se usa, pero lo dejamos por compatibilidad

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
// CONTABILIDAD - CUENTA BS (CON SCROLL)
// ============================================

function renderContabilidadBS() {
    const tbody = document.getElementById('contabilidadBodyBS');
    const rows = state.contabilidad;
    
    const cuentasBS = rows.filter(account => account.currency === 'Bs.');
    
    if (!cuentasBS || cuentasBS.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
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

    // MOSTRAR TODOS LOS REGISTROS (SIN PAGINACIÓN)
    tbody.innerHTML = allRows.map(row => {
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

    // Ocultar paginación
    const pagContainer = document.getElementById('contabilidadBSPagination');
    if (pagContainer) pagContainer.style.display = 'none';
}

// ============================================
// CONTABILIDAD - CUENTA USD (CON SCROLL)
// ============================================

function renderContabilidadUSD() {
    const tbody = document.getElementById('contabilidadBodyUSD');
    const rows = state.contabilidad;
    
    const cuentasUSD = rows.filter(account => account.currency === '$');
    
    if (!cuentasUSD || cuentasUSD.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
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

    // MOSTRAR TODOS LOS REGISTROS (SIN PAGINACIÓN)
    tbody.innerHTML = allRows.map(row => {
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

    // Ocultar paginación
    const pagContainer = document.getElementById('contabilidadUSDPagination');
    if (pagContainer) pagContainer.style.display = 'none';
}

// ============================================
// INVENTARIO (CON SCROLL)
// ============================================

function renderInventario() {
    const tbody = document.getElementById('inventarioBody');
    const rows = state.inventario;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }

    const sorted = [...rows].sort((a, b) => (a.stock || 0) - (b.stock || 0));

    // MOSTRAR TODOS LOS REGISTROS (SIN PAGINACIÓN)
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

    // Ocultar paginación
    const pagContainer = document.getElementById('inventarioPagination');
    if (pagContainer) pagContainer.style.display = 'none';
}

// ============================================
// ENTRADAS (CON SCROLL)
// ============================================

function renderEntradas() {
    const tbody = document.getElementById('entradasBody');
    const rows = state.entradas;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }

    const sorted = [...rows].sort((a, b) => {
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return new Date(b.fecha) - new Date(a.fecha);
    });

    // MOSTRAR TODOS LOS REGISTROS (SIN PAGINACIÓN)
    tbody.innerHTML = sorted.map(row => `
        <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
            <td class="px-md py-md text-body-sm font-body-sm text-on-surface">${formatDate(row.fecha)}</td>
            <td class="px-md py-md text-body-sm font-body-sm font-medium text-on-surface">${row.producto || 'Sin nombre'}</td>
            <td class="px-md py-md text-body-sm font-body-sm text-right text-secondary font-medium">+${formatNumber(row.cantidad || 0)}</td>
        </tr>
    `).join('');

    // Ocultar paginación
    const pagContainer = document.getElementById('entradasPagination');
    if (pagContainer) pagContainer.style.display = 'none';
}

// ============================================
// DONADO (CON SCROLL)
// ============================================

function renderDonado() {
    const tbody = document.getElementById('donadoBody');
    const rows = state.donado;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }

    // Función auxiliar para parsear correctamente "DD/MM/YYYY" o "YYYY-MM-DD"
    const parseFecha = (fechaStr) => {
        if (!fechaStr) return 0;
        if (fechaStr instanceof Date) return fechaStr.getTime();
        
        // Si la fecha viene en formato DD/MM/YYYY
        if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
            const partes = fechaStr.split('/');
            if (partes.length === 3) {
                // partes[2] = YYYY, partes[1] = MM, partes[0] = DD
                return new Date(partes[2], partes[1] - 1, partes[0]).getTime();
            }
        }
        
        const timestamp = new Date(fechaStr).getTime();
        return isNaN(timestamp) ? 0 : timestamp;
    };

    const sorted = [...rows].sort((a, b) => {
        const fechaA = parseFecha(a.fecha);
        const fechaB = parseFecha(b.fecha);

        // 1. Primer criterio: Orden descendente por Fecha
        if (fechaB !== fechaA) {
            return fechaB - fechaA;
        }

        // 2. Segundo criterio (Desempate): Orden descendente por Combo (22, 21, 20...)
        const comboA = Number(String(a.combo || '0').replace(/[^0-9]/g, ''));
        const comboB = Number(String(b.combo || '0').replace(/[^0-9]/g, ''));
        return comboB - comboA;
    });

    // MOSTRAR TODOS LOS REGISTROS (SIN PAGINACIÓN)
    tbody.innerHTML = sorted.map(row => {
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

    // Ocultar paginación
    const pagContainer = document.getElementById('donadoPagination');
    if (pagContainer) pagContainer.style.display = 'none';
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
// EVIDENCIA Y FACTURAS - CONFIGURACIÓN
// ============================================

const evidenciaImagenes = {
    '1': ['img/combos/Combo_1.webp'],
    '2': ['img/combos/Combo_2.webp'],
    '3': ['img/combos/Combo_3.webp','img/combos/Combo_3(1).webp'],
    '4': ['img/combos/Combo_4.webp','img/combos/Combo_4(1).webp'],
    '5': ['img/combos/Combo_5.webp', 'img/combos/Combo_5(1).webp'],
    '6': ['img/combos/Combo_6.webp'],
    '7': ['img/combos/Combo_7.webp'],
    '8': ['img/combos/Combo_8.webp'],
    '9': ['img/combos/Combo_9.webp'],
    '10': ['img/combos/Combo_10.webp'],
    '11': ['img/combos/Combo_11.webp'],
    '12': ['img/combos/Combo_12.webp'],
    '13': ['img/combos/Combo_13.webp'],
    '14': ['img/combos/Combo_14.webp'],
    '15': ['img/combos/Combo_15.webp'],
    '16': ['img/combos/Combo_16.webp', 'img/combos/Combo_16(1).webp','img/combos/Combo_16(2).webp','img/combos/Combo_16(3).webp'],
    '17': ['img/combos/Combo_17.webp','img/combos/Combo_17(1).webp'],
    '18': ['img/combos/Combo_18.webp', 'img/combos/Combo_18(1).webp','img/combos/Combo_18(2).webp'],
    '19': ['img/combos/Combo_19.webp','img/combos/Combo_19(1).webp'],
    '20': ['img/combos/Combo_20.webp','img/combos/Combo_20(1).webp'],
    '21': ['img/combos/Combo_21.webp','img/combos/Combo_21(1).webp'],
    '22': ['img/combos/Combo_22.webp','img/combos/Combo_22(1).webp']
};

const facturaImagenes = {
    '1': '/img/facturas/Factura_1.webp',
    '2': '/img/facturas/Factura_2.webp',
    '3': '/img/facturas/Factura_3.webp',
    '4': '/img/facturas/Factura_4.webp',
    '5': '/img/facturas/Factura_5.webp',
    '6': '/img/facturas/Factura_6.webp',
    '7': '/img/facturas/Factura_7.webp',
    '8': '/img/facturas/Factura_8.webp',
    '9': '/img/facturas/Factura_9.webp',
    '10': '/img/facturas/Factura_10.webp',
    '11': '/img/facturas/Factura_11.webp',
    '12': '/img/facturas/Factura_12.webp',
    '13': '/img/facturas/Factura_13.webp',
    '14': '/img/facturas/Factura_14.webp',
    '15': '/img/facturas/Factura_15.webp',
    '16': '/img/facturas/Factura_16.webp'
};

// ============================================
// VER EVIDENCIA - Mejorado con object-fit: contain
// ============================================

function verEvidencia(combo) {
    console.log('🔍 Ver evidencia para combo:', combo);
    
    const modal = document.getElementById('evidenciaModal');
    const titulo = document.getElementById('evidenciaModalTitulo');
    const galeria = document.getElementById('evidenciaGaleria');
    
    if (!modal) {
        console.error('❌ Modal de evidencia no encontrado');
        return;
    }
    
    titulo.textContent = `Evidencia - Combo ${combo}`;
    
    const imagenes = evidenciaImagenes[combo] || [];
    console.log('📸 Imágenes encontradas:', imagenes.length);
    
    if (imagenes.length === 0) {
        galeria.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #727784; grid-column: 1 / -1;">
                <span class="material-symbols-outlined" style="font-size: 48px;">image_not_supported</span>
                <p style="margin-top: 12px;">No hay imágenes disponibles para el combo ${combo}</p>
            </div>
        `;
    } else {
        galeria.innerHTML = imagenes.map(img => `
            <div class="img-container">
                <img src="${img}" alt="Evidencia Combo ${combo}" onclick="window.open('${img}', '_blank')">
            </div>
        `).join('');
    }
    
    modal.classList.add('active');
    modal.style.display = 'flex'; // Asegurar que se muestre
    document.body.style.overflow = 'hidden';
}

// ============================================
// VER FACTURA - Con zoom
// ============================================

function verFactura(numeroFactura) {
    console.log('📄 Abriendo factura:', numeroFactura);
    
    const modal = document.getElementById('facturaModal');
    const titulo = document.getElementById('facturaModalTitulo');
    const imagen = document.getElementById('facturaImagen');
    const modalBody = document.getElementById('facturaModalBody');
    
    // Limpiar mensajes anteriores
    const oldMsg = modalBody.querySelector('.no-disponible');
    if (oldMsg) oldMsg.remove();
    
    // Buscar la imagen en el mapeo
    const imgSrc = facturaImagenes[numeroFactura] || null;
    console.log('🖼️ Ruta de imagen:', imgSrc);
    
    if (imgSrc) {
        // Configurar y mostrar la imagen
        imagen.style.display = 'block';
        imagen.src = imgSrc;
        imagen.alt = `Factura ${numeroFactura}`;
        imagen.style.maxWidth = '100%';
        imagen.style.maxHeight = '70vh';
        imagen.style.borderRadius = '8px';
        imagen.style.margin = '0 auto';
        imagen.style.cursor = 'zoom-in';
        
        // Eliminar clase de zoom previa
        imagen.classList.remove('zoom-active');
        imagen.style.transform = 'scale(1)';
        
        // Detectar error de carga
        imagen.onerror = function() {
            console.error('❌ Error al cargar la imagen:', imgSrc);
            imagen.style.display = 'none';
            const msg = document.createElement('div');
            msg.className = 'no-disponible';
            msg.style.cssText = 'text-align: center; padding: 40px; color: #727784;';
            msg.innerHTML = `
                <span class="material-symbols-outlined" style="font-size: 48px;">error</span>
                <p style="margin-top: 12px;">No se pudo cargar la imagen de la factura</p>
                <p style="font-size: 12px; color: #999; word-break: break-all;">${imgSrc}</p>
            `;
            modalBody.appendChild(msg);
        };
        
        imagen.onload = function() {
            console.log('✅ Imagen cargada correctamente');
        };
        
        titulo.textContent = `Factura - ${numeroFactura}`;
        
    } else {
        console.warn('⚠️ No hay imagen para:', numeroFactura);
        imagen.style.display = 'none';
        const msg = document.createElement('div');
        msg.className = 'no-disponible';
        msg.style.cssText = 'text-align: center; padding: 40px; color: #727784;';
        msg.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 48px;">receipt_long</span>
            <p style="margin-top: 12px;">No hay factura disponible para ${numeroFactura}</p>
        `;
        modalBody.appendChild(msg);
        titulo.textContent = `Factura - ${numeroFactura} (no disponible)`;
    }
    
    // Abrir el modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ============================================
// ZOOM EN FACTURA (Click para zoom)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const img = document.getElementById('facturaImagen');
    
    if (img) {
        img.addEventListener('click', function(e) {
            this.classList.toggle('zoom-active');
            if (this.classList.contains('zoom-active')) {
                this.style.cursor = 'zoom-out';
                this.style.transform = 'scale(1.8)';
                this.style.transformOrigin = 'center center';
                this.style.maxHeight = '90vh';
            } else {
                this.style.cursor = 'zoom-in';
                this.style.transform = 'scale(1)';
                this.style.maxHeight = '70vh';
            }
        });
        
        img.addEventListener('dblclick', function(e) {
            this.classList.remove('zoom-active');
            this.style.cursor = 'zoom-in';
            this.style.transform = 'scale(1)';
            this.style.maxHeight = '70vh';
        });
    }
});

// ============================================
// CERRAR MODALES
// ============================================

function cerrarFacturaModal() {
    document.getElementById('facturaModal').classList.remove('active');
    document.body.style.overflow = '';
    const msg = document.querySelector('#facturaModalBody .no-disponible');
    if (msg) msg.remove();
    const img = document.getElementById('facturaImagen');
    img.style.display = 'block';
    img.classList.remove('zoom-active');
    img.style.transform = 'scale(1)';
    img.style.maxHeight = '70vh';
    img.style.cursor = 'zoom-in';
}

function cerrarEvidenciaModal() {
    document.getElementById('evidenciaModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// VER TODAS LAS EVIDENCIAS (Botón flotante)
// ============================================

// ============================================
// VER TODAS LAS EVIDENCIAS (Listado completo)
// ============================================

function abrirTodasEvidencias() {
    try {
        const modal = document.getElementById('evidenciaModal');
        const titulo = document.getElementById('evidenciaModalTitulo');
        const galeria = document.getElementById('evidenciaGaleria');

        if (!modal || !galeria) {
            console.error('No se encontraron los elementos del modal de evidencias.');
            return;
        }

        if (titulo) {
            titulo.textContent = '📋 Facturas y Combos';
        }

        let html = '';

        // Asegurar que las variables globales existan
        const facturasObj = typeof facturaImagenes !== 'undefined' ? facturaImagenes : {};
        const combosObj = typeof evidenciaImagenes !== 'undefined' ? evidenciaImagenes : {};

        // 1. FACTURAS (Orden Descendente: de mayor a menor)
        const facturasKeys = Object.keys(facturasObj)
            .map(Number)
            .filter(n => !isNaN(n))
            .sort((a, b) => b - a);

        if (facturasKeys.length > 0) {
            html += `
                <div style="grid-column: 1 / -1; margin-bottom: 8px;">
                    <h3 style="font-weight: 700; color: #003f87; font-size: 18px; border-bottom: 2px solid #003f87; padding-bottom: 8px;">
                        📄 Facturas
                    </h3>
                </div>
            `;

            facturasKeys.forEach(num => {
                html += `
                    <div style="border: 1px solid #e6eff8; border-radius: 8px; padding: 12px; background: white; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <span style="font-weight: 600; color: #141d23; font-size: 14px;">
                            Factura #${num}
                        </span>
                        <button onclick="verFactura('${num}')" class="btn-factura" style="padding: 6px 12px; font-size: 0.75rem; cursor: pointer;">
                            <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">receipt</span>
                            Ver Factura
                        </button>
                    </div>
                `;
            });
        }

        // 2. COMBOS (Orden Descendente: de mayor a menor -> 22, 21, 20, 19, 18, 17...)
        const combosKeys = Object.keys(combosObj)
            .map(Number)
            .filter(n => !isNaN(n))
            .sort((a, b) => b - a);

        if (combosKeys.length > 0) {
            html += `
                <div style="grid-column: 1 / -1; margin-top: 20px; margin-bottom: 8px;">
                    <h3 style="font-weight: 700; color: #003f87; font-size: 18px; border-bottom: 2px solid #003f87; padding-bottom: 8px;">
                        📦 Combos
                    </h3>
                </div>
            `;

            combosKeys.forEach(combo => {
                const imagenes = combosObj[combo] || [];
                html += `
                    <div style="border: 1px solid #e6eff8; border-radius: 8px; padding: 12px; background: white; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <span style="font-weight: 600; color: #141d23; font-size: 14px;">
                            Combo #${combo} <small style="color: #727784;">(${imagenes.length} img)</small>
                        </span>
                        <button onclick="verEvidencia('${combo}')" class="btn-evidencia" style="padding: 6px 12px; font-size: 0.75rem; cursor: pointer;">
                            <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">visibility</span>
                            Ver Evidencia
                        </button>
                    </div>
                `;
            });
        }

        if (!html) {
            html = `
                <div style="text-align: center; padding: 40px; color: #727784; grid-column: 1 / -1;">
                    <span class="material-symbols-outlined" style="font-size: 48px;">image_not_supported</span>
                    <p style="margin-top: 12px;">No hay facturas ni combos disponibles</p>
                </div>
            `;
        }

        galeria.innerHTML = html;
        modal.classList.add('active');
        modal.style.display = 'flex'; // Garantiza visibilidad en caso de que active no aplique display
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Error al abrir modal de evidencias:', error);
    }
}

// Hacer explícitamente accesible la función globalmente
window.abrirTodasEvidencias = abrirTodasEvidencias;

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
    
    // Event listeners para modales
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

// ============================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// ============================================

window.goToPage = function() {}; // Ya no se usa, pero lo dejamos por compatibilidad
window.verEvidencia = verEvidencia;
window.verFactura = verFactura;
window.cerrarFacturaModal = cerrarFacturaModal;
window.cerrarEvidenciaModal = cerrarEvidenciaModal;
window.abrirTodasEvidencias = abrirTodasEvidencias;