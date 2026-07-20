// pages/api/inventario.js
import fs from "fs";

function readSnapshot() {
  const filePath = "/tmp/data/snapshot.json";
  
  console.log("🔍 Leyendo desde:", filePath);
  
  if (!fs.existsSync(filePath)) {
    console.log("❌ Archivo no encontrado");
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);
    console.log("✅ Datos leídos. Inventario:", data.payload?.inventario?.length || 0);
    return data;
  } catch (error) {
    console.error("❌ Error:", error);
    return null;
  }
}

export default function handler(req, res) {
  const snapshot = readSnapshot();
  
  if (!snapshot) {
    return res.status(404).json({ error: "No snapshot available" });
  }
  
  const inventario = snapshot.payload.inventario || [];
  const entradas = snapshot.payload.entradas || [];
  
  res.status(200).json({ inventario, entradas });
}