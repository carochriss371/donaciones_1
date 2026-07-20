import Redis from 'ioredis';

// URL de conexión - usar la que esté disponible
const redisUrl = process.env.KV_REST_API_URL || 
                 process.env.REDIS_URL || 
                 process.env.UPSTASH_REDIS_REST_URL;

// Crear cliente Redis
let redis;
if (redisUrl) {
  try {
    redis = new Redis(redisUrl, {
      password: process.env.KV_REST_API_TOKEN || 
                process.env.UPSTASH_REDIS_REST_TOKEN || 
                undefined
    });
    console.log("✅ Cliente Redis creado para donado");
  } catch (error) {
    console.error("❌ Error creando cliente Redis:", error.message);
    redis = null;
  }
} else {
  console.log("❌ No se encontró URL de Redis para donado");
  redis = null;
}

export default async function handler(req, res) {
  try {
    console.log("🔍 Leyendo donado desde Redis");
    
    if (!redis) {
      return res.status(500).json({ 
        error: "Redis not available",
        env: {
          KV_REST_API_URL: !!process.env.KV_REST_API_URL,
          REDIS_URL: !!process.env.REDIS_URL,
          UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL
        }
      });
    }
    
    const snapshotData = await redis.get('snapshot');
    
    if (!snapshotData) {
      console.log("❌ No hay datos en Redis");
      return res.status(404).json({ 
        error: "No snapshot available",
        message: "Ejecuta el webhook primero para cargar datos"
      });
    }
    
    const snapshot = JSON.parse(snapshotData);
    const donado = snapshot.payload.donado || [];
    
    console.log("📊 Enviando", donado.length, "donaciones");
    res.status(200).json({ donado });
  } catch (error) {
    console.error("❌ Error en donado:", error);
    res.status(500).json({ 
      error: "Error reading data", 
      details: error.message 
    });
  }
}