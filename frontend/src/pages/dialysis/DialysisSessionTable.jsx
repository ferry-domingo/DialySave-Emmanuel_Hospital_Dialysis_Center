import { Pencil, Trash2 } from "lucide-react";
import { useDialysisSessionStore } from "../../store/dialysisSessionStore";
import { formatDoctorName } from "../../utils/doctorName";

const PAYMENT_TYPES = ["PCSO", "PHIC", "CASH"];
const SET_COUNT = 4;
const SESSION_ROWS_PER_SET = 14;
const SET_NAMES = ["FIRST SET", "SECOND SET", "THIRD SET", "FOURTH SET"];

const LAB_TESTS = [
  { key: "CBC", label: "CBC" }, { key: "CREA", label: "CREA" },
  { key: "BUN", label: "BUN" }, { key: "HEPA PROFILE", label: "HEPA" },
  { key: "ALKALINE", label: "ALK." }, { key: "POTASSIUM", label: "K" },
  { key: "PHOSPHORUS", label: "PHOS." }, { key: "CALCIUM", label: "CA" },
  { key: "SODIUM", label: "NA" }, { key: "ALBUMIN", label: "ALB." },
  { key: "Serum Iron", label: "IRON / FERRITIN" },
];

const CATEGORIES = [
  { key: "injections", label: "Injections" },
  { key: "dialyzer", label: "Dialyzer" },
  { key: "intravenous_iron", label: "IV Fe" },
];

const TOTAL_COLUMNS = 5 + CATEGORIES.length * PAYMENT_TYPES.length + LAB_TESTS.length + 1;

const GroupCell = ({ value, type, activeType }) => activeType === type
  ? <span title={value} className="block truncate whitespace-nowrap text-[8px] leading-none font-semibold text-black">{value}</span>
  : <span className="text-slate-300">—</span>;

const TableHeader = ({ printFirstOnly = false }) => (
  <thead className={printFirstOnly ? "print-hide-table-header" : ""}>
    <tr className="bg-slate-50 text-[8px] font-extrabold uppercase tracking-tight text-slate-900">
      <th rowSpan={2} className="border-b border-slate-400 bg-slate-50 px-0.5 py-1 text-center align-bottom">No.</th>
      <th rowSpan={2} className="border-b border-slate-400 bg-slate-50 px-1 py-1 align-bottom">ID No.</th>
      <th rowSpan={2} className="border-b border-slate-400 bg-slate-50 px-1 py-1 align-bottom">Name of Patient</th>
      <th rowSpan={2} className="border-b border-slate-400 bg-slate-50 px-1 py-1 align-bottom">Doctor</th>
      <th rowSpan={2} className="border-b border-slate-400 bg-slate-50 px-1 py-1 text-center align-bottom">Modes of Payment</th>
      {CATEGORIES.map((category) => (
        <th key={category.key} colSpan={PAYMENT_TYPES.length} className="border border-slate-500 bg-blue-50 px-1 py-1 text-center text-blue-950">
          {category.label}
        </th>
      ))}
      <th colSpan={LAB_TESTS.length} className="border border-slate-500 bg-emerald-50 px-1 py-1 text-center text-emerald-950">Laboratory</th>
      <th rowSpan={2} className="no-print border-b border-slate-400 bg-slate-50 px-1 py-1 text-center align-bottom">Actions</th>
    </tr>
    <tr className="bg-white text-[7px] font-bold uppercase tracking-tight text-slate-700">
      {CATEGORIES.flatMap((category) => PAYMENT_TYPES.map((type, index) => (
        <th key={`${category.key}-${type}`} className={`border-b border-slate-400 bg-blue-50/50 px-0.5 py-0.5 text-center ${index === 0 ? "border-l border-l-slate-500" : ""}`}>{type}</th>
      )))}
      {LAB_TESTS.map((lab, index) => (
        <th key={lab.key} title={lab.key === "Serum Iron" ? "Serum Iron / Ferritin" : lab.key} className={`whitespace-normal border-b border-slate-400 bg-emerald-50/50 px-0.5 py-0.5 text-center ${index === 0 ? "border-l border-l-slate-500" : ""}`}>{lab.label}</th>
      ))}
    </tr>
  </thead>
);

const TableColumns = () => (
  <colgroup>
    <col style={{ width: "2%" }} />
    <col style={{ width: "6.5%" }} />
    <col style={{ width: "11%" }} />
    <col style={{ width: "6.5%" }} />
    <col style={{ width: "4.5%" }} />
    {Array.from({ length: 9 }, (_, index) => <col key={`service-${index}`} style={{ width: "4.15%" }} />)}
    {Array.from({ length: 11 }, (_, index) => <col key={`lab-${index}`} style={{ width: "2.55%" }} />)}
    <col className="no-print" style={{ width: "4%" }} />
  </colgroup>
);

const DialysisSessionTable = ({ sessions, loading, onEdit }) => {
  const { deleteSession } = useDialysisSessionStore();

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this dialysis session?")) return;
    await deleteSession(id);
  };

  const countByCategory = (source, categoryKey, type) => source.filter(
    (session) => session?.[categoryKey]?.payment_type === type && session[categoryKey]?.name
  ).length;
  const countLab = (source, labKey) => source.filter((session) =>
    session?.laboratory_results?.some((result) => result.name === labKey && result.done)
  ).length;

  if (loading) return <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">Loading...</div>;

  const visibleSessions = sessions.slice(0, SET_COUNT * SESSION_ROWS_PER_SET);
  const groups = Array.from({ length: SET_COUNT }, (_, index) =>
    visibleSessions.slice(index * SESSION_ROWS_PER_SET, (index + 1) * SESSION_ROWS_PER_SET)
  );

  const doctorTotals = Array.from(sessions.reduce((totals, session) => {
    const doctor = session.doctor;
    if (!doctor) return totals;
    const id = doctor._id || `${doctor.first_name}-${doctor.last_name}`;
    const current = totals.get(id) || {
      name: formatDoctorName(doctor), count: 0,
    };
    current.count += 1;
    totals.set(id, current);
    return totals;
  }, new Map()).values());

  const renderTotals = (source, label, overall = false) => (
    <tr className={overall ? "border-t-2 border-blue-900 bg-blue-100 text-blue-950" : "border-t-2 border-slate-600 bg-slate-50 text-slate-900"}>
      <td className="border border-slate-400 bg-white px-0.5 py-0.5 text-center text-[8px] font-extrabold text-red-600">{source.length}</td>
      <td colSpan={4} className={`border border-slate-700 px-1 py-0.5 text-[8px] font-extrabold uppercase ${overall ? "bg-slate-900 text-white" : "bg-black text-white"}`}>{label}</td>
      {CATEGORIES.flatMap((category) => PAYMENT_TYPES.map((type) => (
        <td key={`${label}-${category.key}-${type}`} className="border border-slate-300 px-0.5 py-0.5 text-center text-[8px] font-bold">{countByCategory(source, category.key, type)}</td>
      )))}
      {LAB_TESTS.map((lab) => <td key={`${label}-${lab.key}`} className="border border-slate-300 px-0.5 py-0.5 text-center text-[8px] font-bold">{countLab(source, lab.key)}</td>)}
      <td className="no-print border border-slate-300" />
    </tr>
  );

  const renderBlankRow = (key) => (
    <tr key={key} className="h-[18px] bg-white">
      {Array.from({ length: TOTAL_COLUMNS }, (_, column) => <td key={column} className={`${column === TOTAL_COLUMNS - 1 ? "no-print" : ""} px-0.5 py-0`}>&nbsp;</td>)}
    </tr>
  );

  const renderSessionRow = (session, rowNumber) => (
    <tr key={session._id} className="h-[18px] bg-white align-middle hover:bg-blue-50">
      <td className="px-0.5 py-0.5 text-center font-semibold text-slate-700">{rowNumber}</td>
      <td title={session.patient?.patient_id || ""} className="whitespace-nowrap bg-slate-50/70 px-0.5 py-0.5 text-[9px] font-bold text-slate-900">{session.patient?.patient_id || "—"}</td>
      <td title={session.patient ? `${session.patient.last_name}, ${session.patient.first_name}` : ""} className="truncate whitespace-nowrap bg-blue-50/60 px-1 py-0.5 font-bold uppercase text-slate-950">{session.patient ? `${session.patient.last_name}, ${session.patient.first_name}` : "—"}</td>
      <td title={formatDoctorName(session.doctor)} className="whitespace-nowrap px-0.5 py-0.5 text-center font-medium uppercase text-black">{formatDoctorName(session.doctor, { lastNameOnly: true }) || "—"}</td>
      <td title={session.payment_type} className="truncate whitespace-nowrap px-1 py-0.5 text-center font-semibold text-black">{session.payment_type}</td>
      {CATEGORIES.flatMap((category) => PAYMENT_TYPES.map((type, index) => (
        <td key={`${category.key}-${type}`} className={`overflow-hidden px-1 py-0.5 text-center ${index === 0 ? "border-l border-black" : ""}`}>
          <GroupCell value={session[category.key]?.name} type={type} activeType={session[category.key]?.payment_type} />
        </td>
      )))}
      {LAB_TESTS.map((lab, index) => {
        const done = session.laboratory_results?.some((result) => result.name === lab.key && result.done);
        return <td key={lab.key} className={`px-0.5 py-0 text-center ${index === 0 ? "border-l border-slate-200" : ""}`}><span className="text-[8px] font-bold text-black">{done ? "✓" : ""}</span></td>;
      })}
      <td className="no-print px-1 py-0.5"><div className="flex justify-center gap-0.5">
        <button onClick={() => onEdit(session)} aria-label="Edit session" className="grid h-4 w-4 place-items-center rounded text-slate-500 transition hover:bg-blue-100 hover:text-blue-700"><Pencil size={10} /></button>
        <button onClick={() => handleDelete(session._id)} aria-label="Delete session" className="grid h-4 w-4 place-items-center rounded text-slate-500 transition hover:bg-red-100 hover:text-red-600"><Trash2 size={10} /></button>
      </div></td>
    </tr>
  );

  return (
    <div className="print-page dialysis-print-page overflow-hidden rounded-xl border border-slate-200 bg-white p-2 pl-0 shadow-sm">
      <div className="dialysis-report-content w-full">
        <div className="space-y-2">
          {groups.map((group, setIndex) => (
            <section key={`session-table-${setIndex}`} className="dialysis-session-set overflow-hidden rounded-lg border border-slate-300 bg-white">
              <h2 className="border-b border-slate-300 bg-gradient-to-r from-blue-50 to-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-800">{SET_NAMES[setIndex]}</h2>
              <table className="w-full table-fixed border-collapse text-left text-[8px] leading-[1.15] [&_td]:overflow-hidden [&_td]:border [&_td]:border-slate-400 [&_td]:px-0.5 [&_th]:break-words [&_th]:border [&_th]:border-slate-500 [&_th]:px-0.5 [&_th]:py-1">
                <TableColumns />
                <TableHeader printFirstOnly={setIndex > 0} />
                <tbody>
                  {Array.from({ length: SESSION_ROWS_PER_SET }, (_, rowIndex) => {
                    const session = group[rowIndex];
                    return session
                      ? renderSessionRow(session, setIndex * SESSION_ROWS_PER_SET + rowIndex + 1)
                      : renderBlankRow(`blank-${setIndex}-${rowIndex}`);
                  })}
                  {renderTotals(group, "Sub Total")}
                </tbody>
                {setIndex === SET_COUNT - 1 && <tfoot>{renderTotals(visibleSessions, "Overall Total", true)}</tfoot>}
              </table>
            </section>
          ))}
        </div>

        {sessions.length > visibleSessions.length && <p className="no-print px-6 py-3 text-sm font-semibold text-amber-700">This four-table report displays the first {visibleSessions.length} sessions.</p>}

        <div className="dialysis-report-footer" style={{ padding: "4px 10px", color: "#000" }}>
          <div className="dialysis-report-footer-content">
            <section style={{ width: 280, fontSize: 14 }}>
              <p style={{ marginBottom: 8, fontSize: 15, fontWeight: 800, textTransform: "uppercase" }}>Nephrologist</p>
              {doctorTotals.length ? doctorTotals.map((doctor) => (
                <div key={doctor.name} style={{ display: "grid", gridTemplateColumns: "220px 40px", alignItems: "center", padding: "3px 0" }}>
                  <span style={{ fontWeight: 700, textTransform: "uppercase" }}>{doctor.name}</span>
                  <span style={{ textAlign: "center", fontWeight: 600 }}>{doctor.count}</span>
                </div>
              )) : <p style={{ padding: "3px 0", color: "#94a3b8" }}>No nephrologist sessions.</p>}
            </section>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", columnGap: 100, rowGap: 58, marginTop: 32, padding: "0 80px" }}>
              {["Cashier on Duty", "Philhealth Officer on Duty", "Charge Nurse on Duty", "Admin Officer on Duty"].map((label) => (
                <div key={label} style={{ display: "flex", alignItems: "flex-start" }}>
                  <p style={{ flex: "0 0 190px", paddingTop: 13, textAlign: "right", fontSize: 14, fontWeight: 800 }}>{label}:</p>
                  <div style={{ width: 270, marginLeft: 28, textAlign: "center" }}>
                    <div style={{ height: 30, borderBottom: "2px solid #000" }} />
                    <p style={{ marginTop: 7, whiteSpace: "nowrap", fontSize: 12, fontWeight: 600 }}>Signature Over Printed Name</p>
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
