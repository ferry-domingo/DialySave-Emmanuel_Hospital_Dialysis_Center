import { Printer } from "lucide-react";

const MonitoringDialyzer = ({ dialyzer }) => {
  const sessions = dialyzer.sessions || [];
  const usedRows = Math.ceil(sessions.length / 5);
  const pageCount = Math.max(1, Math.ceil(usedRows / 30));
  const reportYear = sessions[0]?.date ? new Date(sessions[0].date).getFullYear() : new Date().getFullYear();

  const handlePrint = () => {
    const pageStyle = document.createElement("style");
    pageStyle.textContent = "@media print { @page { size: A4 portrait; margin: 0.35in; } }";
    document.head.appendChild(pageStyle);
    const cleanup = () => pageStyle.remove();
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  };

  return (

    <div className="rounded-xl bg-white p-2.5 shadow-sm">

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Dialyzer</h2>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{dialyzer.total} used</span>
          <button type="button" onClick={handlePrint} className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs [&_td]:!px-2.5 [&_td]:!py-1.5 [&_th]:!px-2.5 [&_th]:!py-1.5">

          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-700">
              <th className="px-4 py-2.5 w-16">#</th>
              <th className="px-4 py-2.5">Dialyzer</th>
              <th className="px-4 py-2.5">Session Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {dialyzer.sessions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400">
                  No dialyzer sessions recorded.
                </td>
              </tr>
            ) : (
              dialyzer.sessions.map((item, index) => (
                <tr key={index} className="transition hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-semibold text-slate-500">{index + 1}</td>
                  <td className="px-4 py-2.5 font-semibold text-black">{item.name}</td>
                  <td className="px-4 py-2.5 font-medium text-black">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      <div className="print-page dialyzer-monitoring-print">
        {Array.from({ length: pageCount }, (_, pageIndex) => {
          const firstRow = pageIndex * 30;
          const rowsOnPage = pageIndex === 0 ? 30 : Math.min(30, Math.max(0, usedRows - firstRow));
          return (
            <section key={pageIndex} className="dialyzer-monitoring-print-page">
              <h1>Dialyzer Monitoring {reportYear}</h1>
              <table>
                <colgroup><col style={{ width: "5%" }} />{Array.from({ length: 5 }, (_, i) => <col key={i} style={{ width: "19%" }} />)}</colgroup>
                <thead><tr><th>No.:</th>{[1, 2, 3, 4, 5].map((number) => <th key={number}>{number}</th>)}</tr></thead>
                <tbody>
                  {Array.from({ length: rowsOnPage }, (_, rowIndex) => {
                    const globalRow = firstRow + rowIndex;
                    return (
                      <tr key={rowIndex}>
                        <td>{globalRow + 1}</td>
                        {Array.from({ length: 5 }, (_, columnIndex) => {
                          const item = sessions[globalRow * 5 + columnIndex];
                          return <td key={columnIndex}>{item ? new Date(item.date).toLocaleDateString("en-PH") : ""}</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>

    </div>

  );

};

export default MonitoringDialyzer;
