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
  } catch (error) {
    redis = null;
  }
}

export default async function handler(req, res) {
  try {
    const envVars = {
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
      REDIS_URL: !!process.env.REDIS_URL,
      UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      redis_connected: !!redis
    };
    
    if (!redis) {
      return res.status(500).json({
        error: "Redis not available",
        env: envVars
      });
    }
    
    const snapshotData = await redis.get('snapshot');
    
    if (!snapshotData) {
      return res.status(404).json({
        error: "No data",
        env: envVars
      });
    }
    
    const snapshot = JSON.parse(snapshotData);
    
    res.status(200).json({
      exists: true,
      env: envVars,
      receivedAt: snapshot.receivedAt,
      contabilidades: snapshot.payload.contabilidades?.length || 0,
      inventario: snapshot.payload.inventario?.length || 0,
      donado: snapshot.payload.donado?.length || 0
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
}