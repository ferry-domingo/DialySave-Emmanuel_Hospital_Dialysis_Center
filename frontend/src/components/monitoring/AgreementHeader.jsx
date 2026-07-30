import { Calendar } from "lucide-react";

import CompletionStatusCard from "./CompletionStatusCard";
import { useAuthStore } from "../../store/authStore";

const InfoField = ({ label, value, icon: Icon }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900">
      {value || "—"}
      {Icon && <Icon size={13} className="text-slate-300" />}
    </p>
  </div>
);

const AgreementHeader = ({ session }) => {
  const { user } = useAuthStore();

  if (!session) return null;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">

      <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 rounded-3xl bg-white p-6 shadow-sm sm:grid-cols-3 lg:grid-cols-5">
        <InfoField label="HD Treatment Session No." value={session.sessionNo} />
        <InfoField label="Date (Month-Day-Year)" value={new Date(session.date).toLocaleDateString()} icon={Calendar} />
        <InfoField label="Patient Name" value={session.patient?.full_name} />
        <InfoField label="Patient ID" value={session.patient?.patient_id} />
        <InfoField label="Facility Representative" value={user?.username} />
      </div>

      <div className="shrink-0 lg:w-96">
        <CompletionStatusCard session={session} />
      </div>

    </div>
  );
};

export default AgreementHeader;
