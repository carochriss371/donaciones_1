// ✅ Versión simplificada para diagnosticar
export default async function handler(req, res) {
  console.log("=== WEBHOOK SIMPLE EJECUTADO ===");
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  
  // Responder siempre con éxito para probar
  return res.status(200).json({ 
    ok: true, 
    message: "Webhook funcionando",
    method: req.method,
    timestamp: new Date().toISOString()
  });
}