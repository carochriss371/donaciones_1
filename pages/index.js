import { useEffect, useState } from "react";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [contabilidades, setContabilidades] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [donado, setDonado] = useState([]);

  useEffect(() => {
    fetch("/api/contabilidad").then(r => r.json()).then(d => {
      setContabilidades(d.contabilidades || []);
      if (d.summary) setSummary(d.summary);
    }).catch(()=>{});
    fetch("/api/inventario").then(r => r.json()).then(d => { setInventario(d.inventario || []); setEntradas(d.entradas || []); }).catch(()=>{});
    fetch("/api/donado").then(r => r.json()).then(d => setDonado(d.donado || [])).catch(()=>{});
  }, []);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Puedes pegar aquí literalmente tu header HTML (convertir class -> className) */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface ...">
        <div className="flex items-center gap-md">
          <h1 className="text-headline-md font-bold text-primary">LOS BUENOS SOMOS MÁS</h1>
        </div>
        <div className="flex items-center gap-md">
          <div className="flex flex-col items-end">
            <span className="text-headline-sm font-bold text-primary">
              {summary ? `$${Number(summary.totalRecaudado).toLocaleString()}` : "$—"}
            </span>
            <span className="text-body-sm text-on-surface-variant">
              {summary ? `Última actualización: ${summary.lastUpdate}` : ""}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-16 lg:pl-64">
        <div className="max-w-container-max mx-auto p-gutter">
          {/* Hero cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div className="bg-white border rounded-xl p-lg shadow-sm">
              <div className="text-label-bold">TOTAL RECAUDADO</div>
              <div className="text-display-lg text-primary">
                {summary ? `$${Number(summary.totalRecaudado).toLocaleString()}` : "—"}
              </div>
            </div>
            <div className="bg-white border rounded-xl p-lg shadow-sm">
              <div className="text-label-bold">TOTAL EJECUTADO</div>
              <div className="text-display-lg">
                {summary ? `$${Number(summary.totalEjecutado).toLocaleString()}` : "—"}
              </div>
            </div>
            <div className="bg-white border rounded-xl p-lg shadow-sm">
              <div className="text-label-bold">SALDO NETO</div>
              <div className="text-display-lg text-secondary">
                {summary ? `$${Number(summary.saldoNeto).toLocaleString()}` : "—"}
              </div>
            </div>
          </section>

          {/* Contabilidad */}
          <section id="contabilidad" className="mt-8 bg-white border rounded-xl">
            <div className="p-md border-b">
              <h3 className="text-headline-sm">Registro Contable</h3>
            </div>
            <div className="overflow-x-auto">
              {contabilidades.length === 0 ? (
                <div className="p-md">No hay datos disponibles.</div>
              ) : (
                contabilidades.map((acc, idx) => (
                  <div key={idx} className="p-md border-b">
                    <h4 className="font-bold">{acc.accountName}</h4>
                    <table className="w-full mt-3">
                      <thead>
                        <tr className="bg-surface-container-low">
                          <th className="px-md py-sm">Fecha</th>
                          <th className="px-md py-sm">Asiento</th>
                          <th className="px-md py-sm">Debe</th>
                          <th className="px-md py-sm">Haber</th>
                          <th className="px-md py-sm">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(acc.rows || []).map((r,i) => (
                          <tr key={i} className="hover:bg-surface-container-lowest">
                            <td className="px-md py-sm">{r.fecha}</td>
                            <td className="px-md py-sm">{r.asiento || r.descripcion}</td>
                            <td className="px-md py-sm">{r.debe ?? ""}</td>
                            <td className="px-md py-sm">{r.haber ?? ""}</td>
                            <td className="px-md py-sm">{r.saldo ?? ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Inventario */}
          <section id="inventario" className="mt-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-lg">
              <div className="bg-white border rounded-xl p-md">
                <h4 className="text-headline-sm">Stock Actual</h4>
                <table className="w-full mt-3">
                  <thead className="bg-surface-container-low">
                    <tr><th className="px-md">Producto ID</th><th>Entradas</th><th>Salidas</th><th>Stock</th></tr>
                  </thead>
                  <tbody>
                    {inventario.map((it,i) => (
                      <tr key={i} className="hover:bg-surface-container-lowest">
                        <td className="px-md py-md">{it.cod} {it.producto}</td>
                        <td className="px-md py-md">{it.entradas ?? ""}</td>
                        <td className="px-md py-md">{it.salidas ?? ""}</td>
                        <td className="px-md py-md">{it.stock ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white border rounded-xl p-md">
                <h4 className="text-headline-sm">Registro de Entradas</h4>
                <table className="w-full mt-3">
                  <thead className="bg-surface-container-low">
                    <tr><th>Fecha</th><th>Producto ID</th><th>Cantidad</th></tr>
                  </thead>
                  <tbody>
                    {entradas.map((e,i) => (
                      <tr key={i} className="hover:bg-surface-container-lowest">
                        <td className="px-md py-md">{e.fecha}</td>
                        <td className="px-md py-md">{e.cod} {e.producto}</td>
                        <td className="px-md py-md">{e.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Donaciones */}
          <section id="donaciones" className="mt-8 bg-white border rounded-xl p-md">
            <h4 className="text-headline-sm">Donaciones y Salidas</h4>
            <table className="w-full mt-3">
              <thead className="bg-surface-container-low">
                <tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Centro</th><th>Combo</th></tr>
              </thead>
              <tbody>
                {donado.map((d,i) => (
                  <tr key={i} className="hover:bg-surface-container-lowest">
                    <td className="px-md py-md">{d.fecha}</td>
                    <td className="px-md py-md">{d.cod} {d.producto}</td>
                    <td className="px-md py-md">{d.cantidad}</td>
                    <td className="px-md py-md">{d.centro || ""}</td>
                    <td className="px-md py-md">{d.combo || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}