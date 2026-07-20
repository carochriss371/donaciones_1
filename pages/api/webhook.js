import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const secret = process.env.SECRET_WEBHOOK || "";
  const incoming = req.headers["x-webhook-secret"] || "";

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!incoming || incoming !== secret) {
    return res.status(401).json({ error: "Invalid webhook secret" });
  }

  const body = req.body;
  try {
    // Usamos /tmp en lugar de process.cwd()/data
    const tmpDir = path.join("/tmp", "data");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const filePath = path.join(tmpDir, "snapshot.json");
    const timestamp = new Date().toISOString();
    const snapshot = { receivedAt: timestamp, payload: body };

    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf8");

    return res.status(200).json({ ok: true, receivedAt: timestamp });
  } catch (err) {
    console.error("Error saving snapshot:", err);
    return res.status(500).json({ error: "Failed to save snapshot", details: err.message });
  }
}