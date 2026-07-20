import fs from "fs";

export default function handler(req, res) {
  const filePath = "/tmp/data/snapshot.json";
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "No data" });
  }
  
  const content = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(content);
  
  res.status(200).json({
    exists: true,
    receivedAt: data.receivedAt,
    contabilidades: data.payload.contabilidades?.length || 0,
    inventario: data.payload.inventario?.length || 0,
    donado: data.payload.donado?.length || 0,
    // Muestra los primeros 2 items de cada uno para verificar
    sample_contabilidades: data.payload.contabilidades?.slice(0, 2),
    sample_inventario: data.payload.inventario?.slice(0, 2),
    sample_donado: data.payload.donado?.slice(0, 2)
  });
}