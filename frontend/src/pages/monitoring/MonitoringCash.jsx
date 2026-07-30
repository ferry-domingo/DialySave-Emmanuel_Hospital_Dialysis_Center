import { useEffect, useRef, useState } from "react";
import { updateCashReason } from "../../api/dialysisSessionApi";
import { useMonitoringStore } from "../../store/monitoringStore";

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

  return (

    <div className="rounded-3xl bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Cash Treatment</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {cash.total} session{cash.total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">

          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-700">
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

    </div>

  );

};

export default MonitoringCash;
