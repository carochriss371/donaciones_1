import { createClient } from '@vercel/kv';

const kv = createClient({
  url: process.env.REDIS_URL
});

export default async function handler(req, res) {
  try {
    console.log("🔍 Leyendo donado desde Redis");
    
    const snapshotData = await kv.get('snapshot');
    
    if (!snapshotData) {
      return res.status(404).json({ error: "No snapshot available" });
    }
    
    const snapshot = JSON.parse(snapshotData);
    const donado = snapshot.payload.donado || [];
    
    console.log("📊 Enviando", donado.length, "donaciones");
    res.status(200).json({ donado });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error reading data" });
  }
}