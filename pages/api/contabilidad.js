// pages/api/contabilidad.js
import fs from "fs";

function readSnapshot() {
  // Leer desde /tmp/data/snapshot.json
  const filePath = "/tmp/data/snapshot.json";
  
  console.log("🔍 Leyendo desde:", filePath);
  
  if (!fs.existsSync(filePath)) {
    console.log("❌ Archivo no encontrado en:", filePath);
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);
    console.log("✅ Datos leídos. Contabilidades:", data.payload?.contabilidades?.length || 0);
    return data;
  } catch (error) {
    console.error("❌ Error leyendo snapshot:", error);
    return null;
  }
}

export default function handler(req, res) {
  const snapshot = readSnapshot();
  
  if (!snapshot) {
    return res.status(404).json({ 
      error: "No snapshot available",
      message: "Ejecuta el webhook primero para cargar datos"
    });
  }
  
  const contabilidades = snapshot.payload.contabilidades || [];
  console.log("📊 Enviando", contabilidades.length, "contabilidades");
  res.status(200).json({ contabilidades });
}