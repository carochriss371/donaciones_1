import fs from "fs";
import path from "path";

function readSnapshot() {
  const filePath = path.join("/tmp", "data", "snapshot.json");
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading snapshot:", error);
    return null;
  }
}

export default function handler(req, res) {
  const snapshot = readSnapshot();
  if (!snapshot) {
    return res.status(404).json({ error: "No snapshot available" });
  }
  const contabilidades = snapshot.payload.contabilidades || [];
  res.status(200).json({ contabilidades });
}