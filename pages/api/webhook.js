import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  console.log("=== WEBHOOK CON @VERCEL/KV ===");
  
  const secret = process.env.SECRET_WEBHOOK || "";
  const incoming = req.headers["x-webhook-secret"] || "";

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!incoming || incoming !== secret) {
    console.log("❌ Secret inválido");
    return res.status(401).json({ error: "Invalid webhook secret" });
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

    // Usar kv directamente (ya configurado por Vercel)
    await kv.set('snapshot', JSON.stringify(snapshot));
    console.log("✅ Snapshot guardado en KV");

    return res.status(200).json({ 
      ok: true, 
      receivedAt: timestamp,
      contabilidades: body.contabilidades?.length || 0,
      inventario: body.inventario?.length || 0,
      donado: body.donado?.length || 0,
      storage: '@vercel/kv'
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error("Stack:", err.stack);
    return res.status(500).json({ 
      error: "Failed to save snapshot", 
      details: err.message 
    });
  }
}