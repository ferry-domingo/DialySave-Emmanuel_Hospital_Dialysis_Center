import { useEffect, useMemo, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { Printer, UsersRound } from "lucide-react";
import toast from "react-hot-toast";

import { getDoctorAgreementBulk } from "../../api/monitoringApi";
import { useDoctorStore } from "../../store/doctorStore";
import AgreementPrintDocument from "./AgreementPrintDocument";

const doctorName = (doctor) => [doctor?.first_name, doctor?.middle_name, doctor?.last_name].filter(Boolean).join(" ");
const doctorIdOf = (patient) => String(patient?.doctor?._id || patient?.doctor || "");

const DoctorAgreementBulkPrint = ({ patients = [] }) => {
  const { doctors, fetchDoctors, loading: doctorsLoading } = useDoctorStore();
  const [doctorId, setDoctorId] = useState("");
  const [printType, setPrintType] = useState("single");
  const [startSession, setStartSession] = useState(1);
  const [endSession, setEndSession] = useState(1);
  const [printSessions, setPrintSessions] = useState([]);
  const [preparing, setPreparing] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!doctors.length) fetchDoctors();
  }, [doctors.length, fetchDoctors]);

  const assignedPatientCount = useMemo(
    () => patients.filter((patient) => doctorIdOf(patient) === doctorId).length,
    [doctorId, patients]
  );
  const normalizedStart = Number(startSession);
  const normalizedEnd = printType === "single" ? normalizedStart : Number(endSession);
  const validRange = Number.isInteger(normalizedStart) && Number.isInteger(normalizedEnd)
    && normalizedStart >= 1 && normalizedEnd >= normalizedStart && normalizedEnd <= 1000;
  const maximumForms = validRange ? assignedPatientCount * (normalizedEnd - normalizedStart + 1) : 0;

  const handlePrint = async () => {
    if (!doctorId || !assignedPatientCount || !validRange || preparing) return;
    setPreparing(true);
    try {
      const { data } = await getDoctorAgreementBulk(doctorId, normalizedStart, normalizedEnd);
      setSummary(data);
      if (!data.sessions?.length) {
        toast.error("No assigned patient has an Agreement Form in the requested session range.");
        return;
      }

      flushSync(() => setPrintSessions(data.sessions));
      toast.success(`${data.totalAssignedPatients} patients found · ${data.totalAgreementForms} agreement forms prepared · ${data.patientsWithoutSessions} patients skipped`);
      const pageStyle = document.createElement("style");
      pageStyle.dataset.agreementPrint = "true";
      pageStyle.textContent = "@media print { @page { size: A4 portrait; margin: 0 0.80in; } .agreement-monitoring-print:not(.doctor-agreement-bulk-print) { display: none !important; } }";
      document.head.appendChild(pageStyle);
      const cleanup = () => {
        pageStyle.remove();
        setPrintSessions([]);
      };
      window.addEventListener("afterprint", cleanup, { once: true });
      await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
      window.print();
      window.setTimeout(cleanup, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to prepare Agreement Form bulk printing.");
    } finally {
      setPreparing(false);
    }
  };

  return (
    <>
      <section className="no-print rounded-xl border border-emerald-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="mr-auto min-w-56">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><UsersRound size={16} /></span>
              Doctor Assigned Patients – Bulk Print
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Print one session or a session range for every patient assigned to a doctor.</p>
          </div>

          <label className="grid gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Doctor
            <select value={doctorId} onChange={(event) => { setDoctorId(event.target.value); setSummary(null); }} className="h-9 min-w-52 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold normal-case tracking-normal text-slate-800">
              <option value="">{doctorsLoading ? "Loading doctors..." : "Select doctor"}</option>
              {[...doctors].sort((a, b) => doctorName(a).localeCompare(doctorName(b))).map((doctor) => (
                <option key={doctor._id} value={doctor._id}>Dr. {doctorName(doctor)}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Print type
            <select value={printType} onChange={(event) => { setPrintType(event.target.value); setSummary(null); }} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold normal-case tracking-normal text-slate-800">
              <option value="single">Single session</option>
              <option value="range">Session range</option>
            </select>
          </label>

          <label className="grid gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
            {printType === "single" ? "Session" : "From"}
            <input type="number" min="1" max="1000" value={startSession} onChange={(event) => { setStartSession(event.target.value); setSummary(null); }} className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-[11px] text-slate-800" />
          </label>

          {printType === "range" && (
            <label className="grid gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
              To
              <input type="number" min={startSession || 1} max="1000" value={endSession} onChange={(event) => { setEndSession(event.target.value); setSummary(null); }} className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-[11px] text-slate-800" />
            </label>
          )}

          <div className="grid h-9 min-w-40 content-center rounded-lg bg-slate-50 px-3 text-[10px] text-slate-600">
            <span><b className="text-slate-900">{assignedPatientCount}</b> assigned patients</span>
            <span>Up to <b className="text-slate-900">{maximumForms}</b> agreement forms</span>
          </div>

          <button type="button" onClick={handlePrint} disabled={!doctorId || !assignedPatientCount || !validRange || preparing} className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">
            <Printer size={15} /> {preparing ? "Preparing..." : "Bulk Print Agreements"}
          </button>
        </div>

        {doctorId && !assignedPatientCount && <p className="mt-2 text-[10px] font-semibold text-amber-600">No patients are currently assigned to this doctor.</p>}
        {!validRange && <p className="mt-2 text-[10px] font-semibold text-red-600">Enter a valid session range from 1 to 1000. The ending session cannot be lower than the starting session.</p>}
        {summary && <p className="mt-2 text-[10px] text-slate-500">{summary.totalAssignedPatients} patients found · {summary.totalAgreementForms} agreement forms prepared · {summary.patientsWithoutSessions} patients had no sessions in the requested range.</p>}
      </section>

      {createPortal(
        <div className="print-page agreement-monitoring-print doctor-agreement-bulk-print">
          {printSessions.map((session) => <AgreementPrintDocument key={session.sessionId} session={session} />)}
        </div>,
        document.body
      )}
    </>
  );
};

export default DoctorAgreementBulkPrint;
