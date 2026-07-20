import fs from "fs";
import path from "path"; 

export default async function handler(req, res) {
  const secret = process.env.SECRET_WEBHOOK || "";
  const incoming = req.headers["x-webhook-secret"] || "";

  console.log("=== WEBHOOK RECIBIDO ===");
  console.log("Method:", req.method);
  console.log("Secret present:", !!incoming);
  console.log("Secret match:", incoming === secret);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!incoming || incoming !== secret) {
    console.log("❌ Secret inválido");
    return res.status(401).json({ error: "Invalid webhook secret" });
  }

  try {
    const body = req.body;
    console.log("✅ Body recibido. Keys:", Object.keys(body));
    console.log("Contabilidades:", body.contabilidades?.length || 0);
    console.log("Inventario:", body.inventario?.length || 0);
    console.log("Donado:", body.donado?.length || 0);
    
    // Crear directorio
    const tmpDir = path.join("/tmp", "data");
    console.log("📁 Directorio a crear:", tmpDir);
    
    if (!fs.existsSync(tmpDir)) {
      console.log("📁 Creando directorio:", tmpDir);
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const filePath = path.join(tmpDir, "snapshot.json");
    console.log("📄 Archivo a guardar:", filePath);
    
    const timestamp = new Date().toISOString();
    const snapshot = { receivedAt: timestamp, payload: body };

    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf8");
    console.log("✅ Snapshot guardado exitosamente en:", filePath);
    
    // Verificar que se guardó
    const stats = fs.statSync(filePath);
    console.log("📊 Tamaño del archivo:", stats.size, "bytes");
    
    const savedContent = fs.readFileSync(filePath, "utf8");
    const savedData = JSON.parse(savedContent);
    console.log("✅ Verificación - Contabilidades:", savedData.payload.contabilidades?.length || 0);

    return res.status(200).json({ 
      ok: true, 
      receivedAt: timestamp,
      contabilidades: savedData.payload.contabilidades?.length || 0,
      inventario: savedData.payload.inventario?.length || 0,
      donado: savedData.payload.donado?.length || 0
    });
  } catch (err) {
    console.error("❌ Error saving snapshot:", err);
    console.error("Stack:", err.stack);
    return res.status(500).json({ 
      error: "Failed to save snapshot", 
      details: err.message 
    });
  }
}