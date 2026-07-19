import { useEffect, useState } from "react";

/**
 * Simple dashboard with 3 tabs:
 * - Contabilidad: muestra totales por cuenta y últimos asientos
 * - Inventario: muestra stock actual (COD, producto, stock)
 * - Donaciones: lista paginada de donado
 *
 * Números se muestran con coma decimal (ej. 16981,68)
 */

function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return "";
  // Mostrar con 2 decimales y coma decimal
  return Number(value).toFixed(2).replace(".", ",");
}

export default function Dashboard() {
  const [tab, setTab] = useState("contabilidad");
  const [contabilidades, setContabilidades] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [donado, setDonado] = useState([]);

  // Donaciones pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(donado.length / pageSize));

  useEffect(() => {
    fetch("/api/contabilidad").then(r => r.json()).then(d => setContabilidades(d.contabilidades || []));
    fetch("/api/inventario").then(r => r.json()).then(d => setInventario(d.inventario || []));
    fetch("/api/donado").then(r => r.json()).then(d => setDonado(d.donado || []));
  }, []);

  function computeTotals(account) {
    const rows = account.rows || [];
    let totalDebe = 0, totalHaber = 0, lastSaldo = null;
    rows.forEach(r => {
      if (r.debe) totalDebe += Number(r.debe);
      if (r.haber) totalHaber += Number(r.haber);
      if (r.saldo !== null && r.saldo !== undefined) lastSaldo = r.saldo;
    });
    return { totalDebe, totalHaber, lastSaldo };
  }

  const pagedDonado = donado.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20 }}>
      <h1 style={{ marginBottom: 10 }}>Dashboard — Donaciones</h1>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("contabilidad")} style={tab === "contabilidad" ? activeBtn : btn}>Contabilidad</button>
        <button onClick={() => setTab("inventario")} style={tab === "inventario" ? activeBtn : btn}>Inventario</button>
        <button onClick={() => setTab("donaciones")} style={tab === "donaciones" ? activeBtn : btn}>Donaciones</button>
      </div>

      {tab === "contabilidad" && (
        <div>
          <h2>Contabilidad</h2>
          {contabilidades.length === 0 && <p>No hay datos disponibles.</p>}
          {contabilidades.map((acc, idx) => {
            const totals = computeTotals(acc);
            return (
              <div key={idx} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>{acc.accountName}</h3>
                <div style={{ marginTop: 8, display: "flex", gap: 16 }}>
                  <div>Total recibido (Debe): <strong>{formatNumber(totals.totalDebe)}</strong></div>
                  <div>Total gastado (Haber): <strong>{formatNumber(totals.totalHaber)}</strong></div>
                  <div>Saldo actual: <strong>{formatNumber(totals.lastSaldo)}</strong></div>
                </div>
                <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>Fecha</th>
                      <th style={th}>Asiento</th>
                      <th style={th}>Debe</th>
                      <th style={th}>Haber</th>
                      <th style={th}>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(acc.rows || []).map((r,i) => (
                      <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                        <td style={td}>{r.fecha}</td>
                        <td style={td}>{r.asiento}</td>
                        <td style={td}>{r.debe !== null && r.debe !== undefined ? formatNumber(r.debe) : ""}</td>
                        <td style={td}>{r.haber !== null && r.haber !== undefined ? formatNumber(r.haber) : ""}</td>
                        <td style={td}>{r.saldo !== null && r.saldo !== undefined ? formatNumber(r.saldo) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {tab === "inventario" && (
        <div>
          <h2>Inventario</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>COD</th>
                <th style={th}>Producto</th>
                <th style={th}>Entradas</th>
                <th style={th}>Salidas</th>
                <th style={th}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {inventario.map((it, i) => (
                <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                  <td style={td}>{it.cod}</td>
                  <td style={td}>{it.producto}</td>
                  <td style={td}>{it.entradas !== null && it.entradas !== undefined ? formatNumber(it.entradas) : ""}</td>
                  <td style={td}>{it.salidas !== null && it.salidas !== undefined ? formatNumber(it.salidas) : ""}</td>
                  <td style={td}>{it.stock !== null && it.stock !== undefined ? formatNumber(it.stock) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "donaciones" && (
        <div>
          <h2>Donaciones</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>COD</th>
                <th style={th}>Producto</th>
                <th style={th}>Fecha</th>
                <th style={th}>Cantidad</th>
                <th style={th}>Centro</th>
                <th style={th}>Combo</th>
              </tr>
            </thead>
            <tbody>
              {pagedDonado.map((d, i) => (
                <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                  <td style={td}>{d.cod}</td>
                  <td style={td}>{d.producto}</td>
                  <td style={td}>{d.fecha}</td>
                  <td style={td}>{d.cantidad}</td>
                  <td style={td}>{d.centro}</td>
                  <td style={td}>{d.combo}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={btn}>Anterior</button>
            <span>Página {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={btn}>Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Styles */
const btn = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
  borderRadius: 4
};
const activeBtn = { ...btn, background: "#0070f3", color: "#fff", borderColor: "#0070f3" };
const th = { textAlign: "left", padding: "8px 6px", background: "#f8f8f8", borderBottom: "1px solid #ddd" };
const td = { padding: "8px 6px" };