// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
    dataUrl: '/data/',
    refreshInterval: 60000, // 1 minuto
    currency: 'USD'
};

// ============================================
// ESTADO GLOBAL
// ============================================
let state = {
    contabilidad: [],
    inventario: [],
    donado: [],
    metadata: null,
    lastUpdate: null,
    summary: {
        totalRecaudado: 0,
        totalEjecutado: 0,
        saldoNeto: 0
    }
};

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

// Cargar todos los datos
async function loadAllData() {
    try {
        showLoadingState();
        
        // Cargar metadata primero
        const metadata = await fetchData('metadata.json');
        state.metadata = metadata;
        
        // Cargar datos
        const [contabilidad, inventario, donado] = await Promise.all([
            fetchData('contabilidad.json'),
            fetchData('inventario.json'),
            fetchData('donado.json')
        ]);
        
        state.contabilidad = contabilidad || [];
        state.inventario = inventario || [];
        state.donado = donado || [];
        state.lastUpdate = new Date();
        
        // Usar fecha de metadata si existe
        if (metadata && metadata.lastUpdate) {
            state.lastUpdate = new Date(metadata.lastUpdate);
        }
        
        calculateSummary();
        renderAll();
        updateLastUpdateTime();
        hideLoadingState();
        
        console.log('✅ Datos cargados correctamente');
        console.log(`📊 Contabilidad: ${state.contabilidad.length} registros`);
        console.log(`📦 Inventario: ${state.inventario.length} registros`);
        console.log(`🤝 Donado: ${state.donado.length} registros`);
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showErrorState();
    }
}

// Fetch data helper
async function fetchData(filename) {
    try {
        const response = await fetch(CONFIG.dataUrl + filename);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn(`⚠️ Error loading ${filename}:`, error.message);
        return null;
    }
}

// Calcular resumen
function calculateSummary() {
    let totalRecaudado = 0;
    let totalEjecutado = 0;
    
    // Calcular desde contabilidad
    state.contabilidad.forEach(account => {
        (account.rows || []).forEach(row => {
            // Asumiendo que 'debe' son ingresos y 'haber' son egresos
            const debe = parseFloat(row.debe) || 0;
            const haber = parseFloat(row.haber) || 0;
            totalRecaudado += debe;
            totalEjecutado += haber;
        });
    });
    
    state.summary = {
        totalRecaudado,
        totalEjecutado,
        saldoNeto: totalRecaudado - totalEjecutado
    };
}

// ============================================
// RENDER FUNCTIONS (igual que antes)
// ============================================

function renderAll() {
    renderSummaryCards();
    renderContabilidad();
    renderInventario();
    renderEntradas();
    renderDonado();
    renderImpacto();
}

function renderSummaryCards() {
    const { totalRecaudado, totalEjecutado, saldoNeto } = state.summary;
    
    document.getElementById('totalRecaudado').textContent = `$${formatNumber(totalRecaudado)}`;
    document.getElementById('totalRecaudadoCard').textContent = `$${formatNumber(totalRecaudado)}`;
    document.getElementById('totalEjecutadoCard').textContent = `$${formatNumber(totalEjecutado)}`;
    document.getElementById('saldoNetoCard').textContent = `$${formatNumber(saldoNeto)}`;
    
    // Progress bar (ejecutado vs recaudado)
    const progress = totalRecaudado > 0 ? Math.min((totalEjecutado / totalRecaudado) * 100, 100) : 0;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${Math.round(progress)}% Meta`;
}

function renderContabilidad() {
    const tbody = document.getElementById('contabilidadBody');
    
    // Obtener todas las filas de todas las cuentas
    let rows = [];
    state.contabilidad.forEach(account => {
        (account.rows || []).forEach(row => {
            rows.push({
                ...row,
                accountName: account.accountName
            });
        });
    });
    
    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }
    
    // Mostrar últimas 10 filas
    const recentRows = rows.slice(-10).reverse();
    
    tbody.innerHTML = recentRows.map(row => {
        const monto = row.debe ? `+$${formatNumber(row.debe)}` : row.haber ? `-$${formatNumber(row.haber)}` : '$0';
        const isIncome = row.debe && !row.haber;
        const colorClass = isIncome ? 'text-secondary' : 'text-error';
        
        return `
            <tr class="hover:bg-surface-container-lowest transition-colors fade-in">
                <td class="px-md py-md text-tabular-nums font-tabular-nums text-on-surface">${row.fecha || '-'}</td>
                <td class="px-md py-md text-body-md font-body-md">${row.asiento || row.descripcion || row.accountName || '-'}</td>
                <td class="px-md py-md text-tabular-nums font-tabular-nums ${colorClass} font-semibold">${monto}</td>
                <td class="px-md py-md text-right">
                    <button class="text-primary hover:underline text-label-bold font-label-bold flex items-center gap-xs justify-end ml-auto" onclick="viewEvidence('${row.id || ''}')">
                        <span class="material-symbols-outlined" style="font-size: 16px;">receipt</span> Ver Evidencia
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderInventario() {
    const tbody = document.getElementById('inventarioBody');
    
    if (!state.inventario || state.inventario.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }
    
    tbody.innerHTML = state.inventario.map(item => {
        const stock = (item.entradas || 0) - (item.salidas || 0);
        const isLow = stock < 100;
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
    
    // Obtener entradas del inventario
    let entradas = [];
    state.inventario.forEach(item => {
        if (item.entradas && item.entradas > 0) {
            entradas.push({
                fecha: item.fecha || new Date().toISOString().split('T')[0],
                cod: item.cod || 'N/A',
                producto: item.producto || 'Sin nombre',
                cantidad: item.entradas
            });
        }
    });
    
    if (entradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }
    
    // Mostrar últimas 10
    const recent = entradas.slice(-10).reverse();
    
    tbody.innerHTML = recent.map(e => `
        <tr class="hover:bg-surface-container-lowest fade-in">
            <td class="px-md py-md text-tabular-nums">${e.fecha}</td>
            <td class="px-md py-md font-medium">${e.cod} (${e.producto})</td>
            <td class="px-md py-md text-tabular-nums text-secondary font-semibold">+${e.cantidad}</td>
        </tr>
    `).join('');
}

function renderDonado() {
    const tbody = document.getElementById('donadoBody');
    
    if (!state.donado || state.donado.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-md py-md text-center text-on-surface-variant">No hay datos disponibles</td></tr>`;
        return;
    }
    
    // Mostrar últimas 10
    const recent = state.donado.slice(-10).reverse();
    
    tbody.innerHTML = recent.map(item => `
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

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return Number(num).toLocaleString('es-VE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function updateLastUpdateTime() {
    const now = state.lastUpdate || new Date();
    const dateStr = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = `Última actualización: ${dateStr}`;
}

function showLoadingState() {
    // Mostrar skeletons o mensaje de carga
    document.querySelectorAll('tbody').forEach(tbody => {
        const colCount = tbody.closest('table')?.querySelector('thead tr')?.children?.length || 3;
        if (!tbody.id.includes('Body')) return;
        tbody.innerHTML = `<tr><td colspan="${colCount}" class="px-md py-md text-center text-on-surface-variant">Cargando datos...</td></tr>`;
    });
}

function hideLoadingState() {
    // Los datos ya se renderizaron
}

function showErrorState() {
    document.querySelectorAll('tbody').forEach(tbody => {
        const colCount = tbody.closest('table')?.querySelector('thead tr')?.children?.length || 3;
        if (!tbody.id.includes('Body')) return;
        tbody.innerHTML = `<tr><td colspan="${colCount}" class="px-md py-md text-center text-error">Error al cargar datos</td></tr>`;
    });
}

function viewEvidence(id) {
    alert(`📄 Ver evidencia del registro: ${id || 'N/A'}\n\n(Esta función mostrará el comprobante asociado)`);
}

function exportData() {
    const data = {
        contabilidad: state.contabilidad,
        inventario: state.inventario,
        donado: state.donado,
        summary: state.summary,
        metadata: state.metadata,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donaciones-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos iniciales
    loadAllData();
    
    // Auto-refresh cada minuto (revisa si hay nuevos datos)
    setInterval(loadAllData, CONFIG.refreshInterval);
    
    // Botón de refrescar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadAllData();
            // Animación visual
            refreshBtn.style.transform = 'rotate(360deg)';
            setTimeout(() => refreshBtn.style.transform = 'rotate(0deg)', 500);
        });
    }
});

// Smooth scroll para navegación
document.querySelectorAll('aside nav a, header nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Exportar funciones globalmente
window.viewEvidence = viewEvidence;
window.exportData = exportData;
window.loadAllData = loadAllData;