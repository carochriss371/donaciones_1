import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    console.log("🔍 Leyendo contabilidad desde KV");
    
    const snapshotData = await kv.get('snapshot');
    
    if (!snapshotData) {
      console.log("❌ No hay datos en KV");
      return res.status(404).json({ 
        error: "No snapshot available",
        message: "Ejecuta el webhook primero para cargar datos"
      });
    }
    
    const snapshot = JSON.parse(snapshotData);
    const contabilidades = snapshot.payload.contabilidades || [];
    
    console.log("📊 Enviando", contabilidades.length, "contabilidades");
    res.status(200).json({ contabilidades });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error reading data", details: error.message });
  }
}