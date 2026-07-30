import { Pencil, Trash2 } from "lucide-react";
import { useDialysisSessionStore } from "../../store/dialysisSessionStore";

const PAYMENT_TYPES = ["PCSO", "PHIC", "CASH"];
const SET_COUNT = 4;
const SESSION_ROWS_PER_SET = 14;

const LAB_TESTS = [
  { key: "CBC", label: "CBC" },
  { key: "CREA", label: "CREA" },
  { key: "BUN", label: "BUN" },
  { key: "HEPA PROFILE", label: "Hepa Profile" },
  { key: "ALKALINE", label: "Alkaline" },
  { key: "POTASSIUM", label: "Potassium" },
  { key: "PHOSPHORUS", label: "Phosphorus" },
  { key: "CALCIUM", label: "Calcium" },
  { key: "SODIUM", label: "Sodium" },
  { key: "ALBUMIN", label: "Albumin" },
  { key: "Serum Iron", label: "Serum Iron / Ferritin" },
];

const CATEGORIES = [
  { key: "injections", label: "Injections" },
  { key: "dialyzer", label: "Dialyzer" },
  { key: "intravenous_iron", label: "IV Fe" },
];

const TOTAL_COLUMNS = 4 + CATEGORIES.length * PAYMENT_TYPES.length + LAB_TESTS.length + 1;

const GroupCell = ({ value, type, activeType }) =>
  activeType === type ? (
    <span className="line-clamp-2 text-xs font-semibold text-black">{value}</span>
  ) : (
    <span className="text-slate-400">—</span>
  );

const DialysisSessionTable = ({ sessions, loading, onEdit }) => {
  const { deleteSession } = useDialysisSessionStore();

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this dialysis session?")) return;
    await deleteSession(id);
  };

  const countByCategory = (source, categoryKey, type) =>
    source.filter(
      (session) => session?.[categoryKey]?.payment_type === type && session[categoryKey]?.name
    ).length;

  const countLab = (source, labKey) =>
    source.filter((session) =>
      session?.laboratory_results?.some((result) => result.name === labKey && result.done)
    ).length;

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
        Loading...
      </div>
    );
  }

  const visibleSessions = sessions.slice(0, SET_COUNT * SESSION_ROWS_PER_SET);
  const groups = Array.from({ length: SET_COUNT }, (_, setIndex) =>
    visibleSessions.slice(
      setIndex * SESSION_ROWS_PER_SET,
      (setIndex + 1) * SESSION_ROWS_PER_SET
    )
  );

  const tintById = new Map();
  let lastPatientId = null;
  let tint = false;
  visibleSessions.forEach((session) => {
    const patientId = session.patient?._id || session.patient?.patient_id;
    if (patientId !== lastPatientId) {
      tint = !tint;
      lastPatientId = patientId;
    }
    tintById.set(session._id, tint);
  });

  const doctorTotals = Array.from(
    sessions.reduce((totals, session) => {
      const doctor = session.doctor;
      if (!doctor) return totals;
      const id = doctor._id || `${doctor.first_name}-${doctor.last_name}`;
      const current = totals.get(id) || {
        name: `Dr. ${doctor.first_name || ""} ${doctor.last_name || ""}`.replace(/\s+/g, " ").trim(),
        count: 0,
      };
      current.count += 1;
      totals.set(id, current);
      return totals;
    }, new Map()).values()
  );

  const renderTotals = (source, label, overall = false) => (
    <tr className={overall ? "bg-black text-white" : "bg-slate-950 text-white"}>
      <td colSpan={4} className="border border-slate-300 px-3 py-2 text-sm font-extrabold uppercase">
        {label}
      </td>
      {CATEGORIES.map((category) =>
        PAYMENT_TYPES.map((type) => (
          <td
            key={`${label}-${category.key}-${type}`}
            className="border border-slate-300 px-2 py-2 text-center text-sm font-bold"
          >
            {countByCategory(source, category.key, type)}
          </td>
        ))
      )}
      {LAB_TESTS.map((lab) => (
        <td
          key={`${label}-${lab.key}`}
          className="border border-slate-300 px-2 py-2 text-center text-sm font-bold"
        >
          {countLab(source, lab.key)}
        </td>
      ))}
      <td className="border border-slate-300" />
    </tr>
  );

  const renderBlankRow = (key) => (
    <tr key={key} className="h-10 bg-white">
      {Array.from({ length: TOTAL_COLUMNS }, (_, column) => (
        <td key={column} className="border-b border-slate-200 px-2 py-2.5">&nbsp;</td>
      ))}
    </tr>
  );

  return (
    <div className="print-page dialysis-print-page overflow-x-auto rounded-3xl bg-white shadow-sm">
      <div className="dialysis-report-content min-w-[2000px]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-wide text-slate-700">
              <th rowSpan={2} className="border-b border-slate-300 px-3 py-2 align-bottom">ID No.</th>
              <th rowSpan={2} className="border-b border-slate-300 px-3 py-2 align-bottom">Name of Patient</th>
              <th rowSpan={2} className="border-b border-slate-300 px-3 py-2 align-bottom">Doctor</th>
              <th rowSpan={2} className="border-b border-slate-300 px-3 py-2 align-bottom">Modes of Payment</th>

              {CATEGORIES.map((category) => (
                <th
                  key={category.key}
                  colSpan={PAYMENT_TYPES.length}
                  className="border-b border-l border-slate-300 bg-slate-50 px-3 py-2 text-center"
                >
                  {category.label}
                </th>
              ))}

              <th
                colSpan={LAB_TESTS.length}
                className="border-b border-l border-slate-300 bg-slate-50 px-3 py-2 text-center"
              >
                Laboratory
              </th>
              <th rowSpan={2} className="border-b border-slate-300 px-3 py-2 text-center align-bottom">Actions</th>
            </tr>

            <tr className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
              {CATEGORIES.flatMap((category) =>
                PAYMENT_TYPES.map((type, index) => (
                  <th
                    key={`${category.key}-${type}`}
                    className={`border-b border-slate-300 px-2 py-1.5 text-center ${index === 0 ? "border-l" : ""}`}
                  >
                    {type}
                  </th>
                ))
              )}
              {LAB_TESTS.map((lab, index) => (
                <th
                  key={lab.key}
                  className={`border-b border-slate-300 px-2 py-1.5 text-center ${index === 0 ? "border-l" : ""}`}
                >
                  {lab.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {groups.map((group, setIndex) => [
              ...Array.from({ length: SESSION_ROWS_PER_SET }, (_, rowIndex) => {
                const session = group[rowIndex];
                if (!session) return renderBlankRow(`blank-${setIndex}-${rowIndex}`);

                return (
                  <tr
                    key={session._id}
                    className={`h-10 border-b border-slate-200 transition hover:bg-amber-50 ${
                      tintById.get(session._id) ? "bg-blue-50/70" : "bg-white"
                    }`}
                  >
                    <td className="px-3 py-2.5 font-bold text-black">{session.patient?.patient_id || "—"}</td>
                    <td className="px-3 py-2.5 font-semibold text-black">
                      {session.patient ? `${session.patient.last_name}, ${session.patient.first_name}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-black">
                      {session.doctor ? `Dr. ${session.doctor.last_name}` : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                        {session.payment_type}
                      </span>
                    </td>

                    {CATEGORIES.flatMap((category) =>
                      PAYMENT_TYPES.map((type, index) => (
                        <td
                          key={`${category.key}-${type}`}
                          className={`px-2 py-2.5 text-center ${index === 0 ? "border-l border-slate-200" : ""}`}
                        >
                          <GroupCell
                            value={session[category.key]?.name}
                            type={type}
                            activeType={session[category.key]?.payment_type}
                          />
                        </td>
                      ))
                    )}

                    {LAB_TESTS.map((lab, index) => {
                      const done = session.laboratory_results?.some(
                        (result) => result.name === lab.key && result.done
                      );
                      return (
                        <td
                          key={lab.key}
                          className={`px-2 py-2.5 text-center ${index === 0 ? "border-l border-slate-200" : ""}`}
                        >
                          <span className="text-sm font-bold text-black">{done ? "✓" : "✕"}</span>
                        </td>
                      );
                    })}

                    <td className="px-3 py-2.5">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => onEdit(session)}
                          aria-label="Edit session"
                          className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(session._id)}
                          aria-label="Delete session"
                          className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }),
              renderTotals(group, `Sub Total ${setIndex + 1}`),
            ])}
          </tbody>

          <tfoot>{renderTotals(visibleSessions, "Overall Total", true)}</tfoot>
        </table>

        {sessions.length > visibleSessions.length && (
          <p className="px-6 py-3 text-sm font-semibold text-amber-700">
            This four-set report displays the first {visibleSessions.length} sessions.
          </p>
        )}

        <div style={{ minHeight: 360, padding: "24px 48px", color: "#000" }}>
          <div className="dialysis-report-footer-content" style={{ width: 1400, margin: "0 auto" }}>
          <section style={{ width: 280, fontSize: 14 }}>
            <p style={{ marginBottom: 8, fontSize: 15, fontWeight: 800, textTransform: "uppercase" }}>
              Nephrologist
            </p>
            {doctorTotals.length ? doctorTotals.map((doctor) => (
              <div
                key={doctor.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "220px 40px",
                  alignItems: "center",
                  padding: "3px 0",
                }}
              >
                <span style={{ fontWeight: 700, textTransform: "uppercase" }}>{doctor.name}</span>
                <span style={{ textAlign: "center", fontWeight: 600 }}>{doctor.count}</span>
              </div>
            )) : (
              <p style={{ padding: "3px 0", color: "#94a3b8" }}>No nephrologist sessions.</p>
            )}
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              columnGap: 100,
              rowGap: 58,
              marginTop: 32,
              padding: "0 80px",
            }}
          >
            {[
              "Cashier on Duty",
              "Philhealth Officer on Duty",
              "Charge Nurse on Duty",
              "Admin Officer on Duty",
            ].map((label) => (
              <div key={label} style={{ display: "flex", alignItems: "flex-start" }}>
                <p
                  style={{
                    flex: "0 0 190px",
                    paddingTop: 13,
                    textAlign: "right",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {label}:
                </p>
                <div style={{ width: 270, marginLeft: 28, textAlign: "center" }}>
                  <div style={{ height: 30, borderBottom: "2px solid #000" }} />
                  <p style={{ marginTop: 7, whiteSpace: "nowrap", fontSize: 12, fontWeight: 600 }}>
                    Signature Over Printed Name
                  </p>
                </div>
              </div>
            ))}
          </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialysisSessionTable;
