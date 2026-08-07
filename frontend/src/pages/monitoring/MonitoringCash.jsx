import { useEffect, useRef, useState } from "react";
import { updateCashReason } from "../../api/dialysisSessionApi";
import { useMonitoringStore } from "../../store/monitoringStore";
import { Printer } from "lucide-react";

const MonitoringCash = ({ cash }) => {
  const timers = useRef({});
  const setCashReason = useMonitoringStore((state) => state.setCashReason);
  const rows = cash.sessions || cash.dates.map((date, index) => ({
    id: null,
    date,
    reason: cash.reasons?.[index] || "",
  }));
  const [reasons, setReasons] = useState({});
  const [saveStatus, setSaveStatus] = useState({});

  useEffect(() => {
    setReasons(Object.fromEntries(rows.map((row, index) => [row.id || index, row.reason || ""])));
  }, [cash]);

  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout);
  }, []);

  const saveReason = async (row, key, reason) => {
    if (!row.id || reason === row.reason) return;
    setSaveStatus((current) => ({ ...current, [key]: "saving" }));
    clearTimeout(timers.current[key]);
    try {
      const { data } = await updateCashReason(row.id, reason);
      const savedReason = data.data.reason;
      setCashReason(row.id, savedReason);
      setReasons((current) => ({ ...current, [key]: savedReason }));
      setSaveStatus((current) => ({ ...current, [key]: "saved" }));
    } catch {
      setSaveStatus((current) => ({ ...current, [key]: "error" }));
    }
  };

  const handleReasonChange = (row, index, reason) => {
    const key = row.id || index;
    setReasons((current) => ({ ...current, [key]: reason }));

    if (!row.id) return;

    setSaveStatus((current) => ({ ...current, [key]: "saving" }));
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => saveReason(row, key, reason), 600);
  };

  const handlePrint = () => {
    const pageStyle = document.createElement("style");
    pageStyle.textContent = "@media print { @page { size: A4 landscape; margin: 0.35in; } }";
    document.head.appendChild(pageStyle);
    const cleanup = () => pageStyle.remove();
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  };

  const printPageCount = Math.max(1, Math.ceil(rows.length / 30));
  const formatDate = (value) => value
    ? new Date(value).toLocaleDateString("en-PH", { month: "2-digit", day: "2-digit", year: "numeric" })
    : "";

  return (

    <div className="rounded-xl bg-white p-2.5 shadow-sm">

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Cash Treatment</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {cash.total} session{cash.total === 1 ? "" : "s"}
          </span>
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
              <th className="px-4 py-2.5">Session Date</th>
              <th className="px-4 py-2.5">Reason</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400">
                  No cash treatment sessions recorded.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const key = row.id || index;
                return (
                <tr key={key} className="transition hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-semibold text-slate-500">{index + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-black">
                    {new Date(row.date).toLocaleDateString()}
                  </td>
                  <td className="min-w-64 px-4 py-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={reasons[key] ?? ""}
                        onChange={(event) => handleReasonChange(row, index, event.target.value)}
                        onBlur={() => saveReason(row, key, reasons[key] ?? "")}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                        }}
                        placeholder="Click to add reason"
                        maxLength={500}
                        disabled={!row.id}
                        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-200 focus:border-slate-300 focus:bg-white disabled:cursor-not-allowed"
                      />
                      {saveStatus[key] === "saving" && <span className="text-xs text-slate-400">Saving...</span>}
                      {saveStatus[key] === "saved" && <span className="text-xs text-emerald-600">Saved</span>}
                      {saveStatus[key] === "error" && <span className="text-xs text-red-600">Save failed</span>}
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>

      <div className="print-page cash-monitoring-print">
        {Array.from({ length: printPageCount }, (_, pageIndex) => {
          const pageRows = rows.slice(pageIndex * 30, (pageIndex + 1) * 30);
          const physicalRows = pageIndex === 0 ? 15 : Math.min(15, pageRows.length);
          return (
            <section key={pageIndex} className="cash-monitoring-print-page">
              <table>
                <colgroup>
                  <col style={{ width: "3%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "32%" }} />
                  <col style={{ width: "3%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "32%" }} />
                </colgroup>
                <thead>
                  <tr><th colSpan={6} className="cash-print-title">Cash Session Monitoring</th></tr>
                  <tr>
                    <th colSpan={2}>Session Dates</th><th>Reason</th>
                    <th colSpan={2}>Session Dates</th><th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: physicalRows }, (_, rowIndex) => {
                    const left = pageRows[rowIndex];
                    const right = pageRows[rowIndex + 15];
                    const leftNumber = pageIndex * 30 + rowIndex + 1;
                    const rightNumber = leftNumber + 15;
                    return (
                      <tr key={rowIndex}>
                        <td className="cash-print-number">{pageIndex === 0 || left ? leftNumber : ""}</td>
                        <td className="cash-print-date">{formatDate(left?.date)}</td>
                        <td className="cash-print-reason">{left ? (reasons[left.id || leftNumber - 1] ?? left.reason ?? "") : ""}</td>
                        <td className="cash-print-number">{pageIndex === 0 || right ? rightNumber : ""}</td>
                        <td className="cash-print-date">{formatDate(right?.date)}</td>
                        <td className="cash-print-reason">{right ? (reasons[right.id || rightNumber - 1] ?? right.reason ?? "") : ""}</td>
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

export default MonitoringCash;
