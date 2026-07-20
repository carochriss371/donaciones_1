// scripts/fetch-data.js - con logs mejorados

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const CONFIG = {
    webhookUrl: process.env.WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbzStX3Nm2-qKLefxoSeInFTTGT4YE7zPmesTRT_3wGV3yBKdBH5Eb-GSprvFxlcPO1R/exec',
    webhookSecret: process.env.WEBHOOK_SECRET || '<G4t0&M@landr0$>',
    timeout: 60000,
    retries: 3,
    retryDelay: 5000
};

async function fetchData() {
    console.log('🔄 Obteniendo datos desde Google Apps Script...');
    console.log(`📡 URL: ${CONFIG.webhookUrl}`);
    
    try {
        const response = await axios({
            method: 'post',
            url: CONFIG.webhookUrl,
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
        
        console.log('✅ Datos recibidos correctamente');
        console.log('📦 Status:', response.status);
        console.log('📦 Headers:', JSON.stringify(response.headers, null, 2));
        console.log('📦 Data type:', typeof response.data);
        console.log('📦 Data keys:', Object.keys(response.data || {}));
        console.log('📦 Data sample:', JSON.stringify(response.data, null, 2).substring(0, 500));
        
        // Verificar la estructura de datos
        const data = response.data;
        
        // Intentar diferentes estructuras posibles
        let contabilidades = [];
        let inventario = [];
        let donado = [];
        
        // Estructura 1: Directa
        if (data.contabilidades) {
            contabilidades = data.contabilidades;
            inventario = data.inventario || [];
            donado = data.donado || [];
        }
        // Estructura 2: Anidada en payload
        else if (data.payload) {
            contabilidades = data.payload.contabilidades || [];
            inventario = data.payload.inventario || [];
            donado = data.payload.donado || [];
        }
        // Estructura 3: Directa con nombres diferentes
        else if (data.data) {
            contabilidades = data.data.contabilidades || [];
            inventario = data.data.inventario || [];
            donado = data.data.donado || [];
        }
        // Estructura 4: Array directo de contabilidad
        else if (Array.isArray(data)) {
            contabilidades = data;
        }
        
        console.log(`📊 Contabilidad: ${contabilidades.length} registros`);
        console.log(`📦 Inventario: ${inventario.length} registros`);
        console.log(`🤝 Donado: ${donado.length} registros`);
        
        // Guardar datos
        const dataDir = path.join(__dirname, '../public/data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(dataDir, 'contabilidad.json'),
            JSON.stringify(contabilidades, null, 2)
        );
        fs.writeFileSync(
            path.join(dataDir, 'inventario.json'),
            JSON.stringify(inventario, null, 2)
        );
        fs.writeFileSync(
            path.join(dataDir, 'donado.json'),
            JSON.stringify(donado, null, 2)
        );
        
        // Guardar también la respuesta completa para depuración
        fs.writeFileSync(
            path.join(dataDir, 'debug_response.json'),
            JSON.stringify(data, null, 2)
        );
        
        console.log('✅ Todos los datos actualizados correctamente');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('📨 Respuesta del servidor:', error.response.status);
            console.error('📄 Datos:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(0);
    }
}

fetchData();