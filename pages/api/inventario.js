import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    console.log("🔍 Leyendo inventario desde KV");
    
    const snapshotData = await kv.get('snapshot');
    
    if (!snapshotData) {
      return res.status(404).json({ error: "No snapshot available" });
    }
    
    const snapshot = JSON.parse(snapshotData);
    const inventario = snapshot.payload.inventario || [];
    const entradas = snapshot.payload.entradas || [];
    
    console.log("📊 Enviando", inventario.length, "inventario,", entradas.length, "entradas");
    res.status(200).json({ inventario, entradas });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error reading data" });
  }
}