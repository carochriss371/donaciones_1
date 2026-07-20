import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    console.log("🔍 Debug - leyendo desde KV");
    
    const snapshotData = await kv.get('snapshot');
    
    if (!snapshotData) {
      return res.status(404).json({ 
        error: "No data in KV",
        message: "Ejecuta el webhook primero",
        note: "Asegúrate que la base KV esté conectada al proyecto"
      });
    }
    
    const snapshot = JSON.parse(snapshotData);
    
    res.status(200).json({
      exists: true,
      storage: '@vercel/kv',
      receivedAt: snapshot.receivedAt,
      contabilidades: snapshot.payload.contabilidades?.length || 0,
      inventario: snapshot.payload.inventario?.length || 0,
      donado: snapshot.payload.donado?.length || 0,
      sample_contabilidades: snapshot.payload.contabilidades?.slice(0, 2),
      sample_inventario: snapshot.payload.inventario?.slice(0, 2),
      sample_donado: snapshot.payload.donado?.slice(0, 2)
    });
  } catch (error) {
    console.error("❌ Error en debug:", error);
    res.status(500).json({ 
      error: error.message,
      note: "Verifica que la base KV esté conectada al proyecto"
    });
  }
}