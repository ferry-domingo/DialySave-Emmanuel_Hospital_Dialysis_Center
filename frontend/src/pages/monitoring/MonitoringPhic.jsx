import { Fragment, useEffect, useState } from "react";
import { Download, Printer, Search } from "lucide-react";

const TOTAL_SLOTS = 156;
const ROWS = 16;
const COLS = Math.ceil(TOTAL_SLOTS / ROWS);

const MonitoringPhic = ({ phic }) => {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "@media print { @page { size: landscape; margin: 0.4in; } }";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
    number: i + 1,
    date: phic.dates[i] ? new Date(phic.dates[i]).toLocaleDateString() : "",
  }));

  const matches = (slot) =>
    !search || String(slot.number).includes(search) || slot.date.includes(search);

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const rows = ["Session No.,Date", ...slots.map((s) => `${s.number},${s.date}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "phic-session-dates.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">

      <div className="no-print flex flex-wrap items-center justify-end gap-2">

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-32 bg-transparent text-sm text-black outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={handlePrint}
          aria-label="Print"
          className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Printer size={16} />
        </button>

        <button
          onClick={handleDownload}
          aria-label="Download"
          className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Download size={16} />
        </button>

      </div>

      <div className="print-page overflow-hidden border border-black bg-white shadow-sm">

        {phic.exceeded && (
          <p className="no-print m-3 rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
            PHIC limit of 156 sessions reached.
          </p>
        )}

        <p className="border-b border-black py-1 text-center text-3xl font-extrabold leading-none text-black">
          PHILHEALTH
        </p>

        <p className="border-b border-black px-1 py-0.5 text-lg font-extrabold uppercase leading-none text-black">
          Session Dates
        </p>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-xs">
            <colgroup>
              {Array.from({ length: COLS }, (_, col) => (
                <Fragment key={col}>
                  <col className="w-[2.4%]" />
                  <col className="w-[7.6%]" />
                </Fragment>
              ))}
            </colgroup>
            <tbody>
              {Array.from({ length: ROWS }, (_, row) => (
                <tr key={row}>
                  {Array.from({ length: COLS }, (_, col) => {
                    const slot = slots[col * ROWS + row];

                    if (!slot) {
                      return <td key={col} colSpan={2}></td>;
                    }

                    const dim = !matches(slot);

                    return (
                      <Fragment key={col}>
                        <td className={`h-7 border border-black px-1 py-1 text-center font-medium text-black ${dim ? "opacity-30" : ""}`}>
                          {slot.number}
                        </td>
                        <td className={`h-7 border border-black px-1 py-1 text-center font-medium text-black ${dim ? "opacity-30" : ""}`}>
                          {slot.date}
                        </td>
                      </Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default MonitoringPhic;
