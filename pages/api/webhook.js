import Redis from 'ioredis';

// URL de conexión - usar la que esté disponible
const redisUrl = process.env.KV_REST_API_URL || 
                 process.env.REDIS_URL || 
                 process.env.UPSTASH_REDIS_REST_URL;

console.log("🔍 Redis URL disponible:", !!redisUrl);

// Crear cliente Redis
let redis;
if (redisUrl) {
  try {
    redis = new Redis(redisUrl, {
      // Para Upstash/KV necesitamos el token como password
      password: process.env.KV_REST_API_TOKEN || 
                process.env.UPSTASH_REDIS_REST_TOKEN || 
                undefined
    });
    console.log("✅ Cliente Redis creado exitosamente");
  } catch (error) {
    console.error("❌ Error creando cliente Redis:", error.message);
    redis = null;
  }
} else {
  console.log("❌ No se encontró URL de Redis");
  redis = null;
}

export default async function handler(req, res) {
  console.log("=== WEBHOOK ===");
  
  const secret = process.env.SECRET_WEBHOOK || "";
  const incoming = req.headers["x-webhook-secret"] || "";

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!incoming || incoming !== secret) {
    console.log("❌ Secret inválido");
    return res.status(401).json({ error: "Invalid webhook secret" });
  }

  if (!redis) {
    console.log("❌ Redis no disponible");
    return res.status(500).json({ 
      error: "Redis not available",
      details: "No se pudo conectar a Redis",
      env: {
        KV_REST_API_URL: !!process.env.KV_REST_API_URL,
        REDIS_URL: !!process.env.REDIS_URL,
        UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL
      }
    });
  }

  try {
    const body = req.body;
    console.log("✅ Body recibido");
    console.log("Contabilidades:", body.contabilidades?.length || 0);
    console.log("Inventario:", body.inventario?.length || 0);
    console.log("Donado:", body.donado?.length || 0);
    
    const timestamp = new Date().toISOString();
    const snapshot = { 
      receivedAt: timestamp, 
      payload: body 
    };

    await redis.set('snapshot', JSON.stringify(snapshot));
    console.log("✅ Snapshot guardado en Redis");

    return res.status(200).json({ 
      ok: true, 
      receivedAt: timestamp,
      contabilidades: body.contabilidades?.length || 0,
      inventario: body.inventario?.length || 0,
      donado: body.donado?.length || 0
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    return res.status(500).json({ 
      error: "Failed to save snapshot", 
      details: err.message 
    });
  }
}