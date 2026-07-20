import Redis from 'ioredis';

const redisUrl = process.env.KV_REST_API_URL || 
                 process.env.REDIS_URL || 
                 process.env.UPSTASH_REDIS_REST_URL;

let redis;
if (redisUrl) {
  try {
    redis = new Redis(redisUrl, {
      password: process.env.KV_REST_API_TOKEN || 
                process.env.UPSTASH_REDIS_REST_TOKEN || 
                undefined
    });
    console.log("✅ Cliente Redis creado para contabilidad");
  } catch (error) {
    console.error("❌ Error:", error.message);
    redis = null;
  }
} else {
  redis = null;
}

export default async function handler(req, res) {
  try {
    console.log("🔍 Leyendo contabilidad");
    
    if (!redis) {
      return res.status(500).json({ 
        error: "Redis not available",
        env: {
          KV_REST_API_URL: !!process.env.KV_REST_API_URL,
          REDIS_URL: !!process.env.REDIS_URL
        }
      });
    }
    
    const snapshotData = await redis.get('snapshot');
    
    if (!snapshotData) {
      return res.status(404).json({ error: "No snapshot available" });
    }
    
    const snapshot = JSON.parse(snapshotData);
    const contabilidades = snapshot.payload.contabilidades || [];
    
    res.status(200).json({ contabilidades });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error reading data", details: error.message });
  }
}