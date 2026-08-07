import { Fragment } from "react";

const TOTAL_SLOTS = 156;
const ROWS = 16;
const COLS = Math.ceil(TOTAL_SLOTS / ROWS);

const MonitoringPhic = ({ phic }) => {
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
    number: i + 1,
    date: phic.dates[i] ? new Date(phic.dates[i]).toLocaleDateString() : "",
  }));

  return (
    <div>

      <div className="print-page phic-monitoring-print overflow-hidden border border-black bg-white shadow-sm">

        {phic.exceeded && (
          <p className="no-print m-3 rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
            PHIC limit of 156 sessions reached.
          </p>
        )}

        <p className="phic-print-title border-b border-black py-1 text-center text-3xl font-extrabold leading-none text-black">
          PHILHEALTH
        </p>

        <p className="phic-print-subtitle border-b border-black px-1 py-0.5 text-lg font-extrabold uppercase leading-none text-black">
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

                    return (
                      <Fragment key={col}>
                        <td className="h-7 border border-black px-1 py-1 text-center font-medium text-black">
                          {slot.number}
                        </td>
                        <td className="h-7 border border-black px-1 py-1 text-center font-medium text-black">
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
