const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuración
const CONFIG = {
    webhookUrl: process.env.WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbwN9rk_9g64kyYMd9sVO2lajxHuxSoiZgOxi3ntLiPgD7N8kjdeEh8PTZPfyXfqFc8f/exec',
    webhookSecret: process.env.WEBHOOK_SECRET || '<G4t0&M@landr0$>',
    timeout: 60000, // 60 segundos para Apps Script (puede tardar)
    retries: 3,
    retryDelay: 5000
};

async function fetchWithRetry(url, options, retries = CONFIG.retries) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios({
                method: 'post',
                url: url,
                data: {
                    action: 'getData',
                    timestamp: new Date().toISOString()
                },
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': CONFIG.webhookSecret
                },
                timeout: CONFIG.timeout
            });
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`🔄 Reintentando (${i + 1}/${retries})...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
        }
    }
}

async function fetchData() {
    console.log('🔄 Obteniendo datos desde Google Apps Script...');
    console.log(`📡 URL: ${CONFIG.webhookUrl}`);
    console.log(`⏰ Timeout: ${CONFIG.timeout/1000} segundos`);
    console.log(`🔄 Reintentos: ${CONFIG.retries}`);
    
    try {
        const response = await fetchWithRetry(CONFIG.webhookUrl, {});
        
        if (response.status !== 200) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = response.data;
        console.log('✅ Datos recibidos correctamente');
        console.log(`📊 Contabilidad: ${data.contabilidades?.length || 0} registros`);
        console.log(`📦 Inventario: ${data.inventario?.length || 0} registros`);
        console.log(`🤝 Donado: ${data.donado?.length || 0} registros`);
        
        // Validar estructura de datos
        if (!data.contabilidades && !data.inventario && !data.donado) {
            console.warn('⚠️ Estructura de datos inesperada, usando datos vacíos');
        }
        
        // Guardar en archivos JSON
        const dataDir = path.join(__dirname, '../public/data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const sections = [
            { name: 'contabilidad', data: data.contabilidades || [] },
            { name: 'inventario', data: data.inventario || [] },
            { name: 'donado', data: data.donado || [] }
        ];
        
        sections.forEach(({ name, data: sectionData }) => {
            const filePath = path.join(dataDir, `${name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(sectionData, null, 2));
            console.log(`✅ ${name}.json guardado (${sectionData.length} registros)`);
        });
        
        // Guardar metadatos
        const metadata = {
            lastUpdate: new Date().toISOString(),
            source: 'Google Apps Script',
            webhookUrl: CONFIG.webhookUrl,
            totalContabilidad: sections[0].data.length,
            totalInventario: sections[1].data.length,
            totalDonado: sections[2].data.length
        };
        fs.writeFileSync(
            path.join(dataDir, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );
        
        console.log('✅ Todos los datos actualizados correctamente');
        console.log(`🕐 Última actualización: ${metadata.lastUpdate}`);
        
    } catch (error) {
        console.error('❌ Error al obtener datos:', error.message);
        
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ Timeout: El script de Apps Script tardó demasiado en responder');
            console.error('💡 Sugerencia: Verifica que el script de Apps Script esté optimizado');
        } else if (error.response) {
            console.error(`📨 Código HTTP: ${error.response.status}`);
            console.error('📄 Respuesta:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('🌐 No se recibió respuesta del servidor');
            console.error('💡 Sugerencia: Verifica que la URL del webhook sea correcta');
        }
        
        // Verificar si existen datos anteriores
        const dataDir = path.join(__dirname, '../public/data');
        const metadataPath = path.join(dataDir, 'metadata.json');
        
        if (fs.existsSync(metadataPath)) {
            console.log('📂 Usando datos anteriores (no se actualizaron)');
            process.exit(0);
        } else {
            console.log('⚠️ No hay datos anteriores. Creando datos de ejemplo...');
            createSampleData();
        }
    }
}

function createSampleData() {
    const dataDir = path.join(__dirname, '../public/data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const sampleData = {
        contabilidades: [
            {
                accountName: "Caja Principal",
                rows: [
                    { fecha: new Date().toISOString().split('T')[0], asiento: "Donación inicial", debe: 1000, haber: 0, saldo: 1000 }
                ]
            }
        ],
        inventario: [
            { cod: "PROD-001", producto: "Producto de ejemplo", entradas: 100, salidas: 20, fecha: new Date().toISOString().split('T')[0] }
        ],
        donado: [
            { fecha: new Date().toISOString().split('T')[0], cod: "PROD-001", producto: "Producto de ejemplo", cantidad: 10, centro: "Centro de prueba", combo: "C-0001" }
        ]
    };
    
    const sections = [
        { name: 'contabilidad', data: sampleData.contabilidades },
        { name: 'inventario', data: sampleData.inventario },
        { name: 'donado', data: sampleData.donado }
    ];
    
    sections.forEach(({ name, data }) => {
        const filePath = path.join(dataDir, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`📝 ${name}.json (datos de ejemplo)`);
    });
    
    const metadata = {
        lastUpdate: new Date().toISOString(),
        source: 'sample-data',
        totalContabilidad: sections[0].data.length,
        totalInventario: sections[1].data.length,
        totalDonado: sections[2].data.length,
        note: 'Datos de ejemplo - reemplazar con datos reales'
    };
    fs.writeFileSync(
        path.join(dataDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
    );
    
    console.log('✅ Datos de ejemplo creados');
}

// Ejecutar
fetchData();