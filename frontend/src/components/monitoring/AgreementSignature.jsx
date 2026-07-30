import { useState } from "react";
import { Calendar } from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/authStore";
import { signAgreement } from "../../api/dialysisSessionApi";

const SignatureBlock = ({ sessionId, role, label, defaultName, signature, onUpdated }) => {
  const [name, setName] = useState(defaultName || "");
  const [saving, setSaving] = useState(false);
  const isSigned = Boolean(signature?.signedAt);

  const handleSign = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);

    try {
      await signAgreement(sessionId, { role, name: name.trim() });
      await onUpdated?.();
      toast.success(`${label} signature recorded`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record signature");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex h-10 flex-1 items-end border-b border-slate-300 pb-1 text-sm font-bold text-slate-900">
          {isSigned ? signature.name : name || <span className="text-slate-300">Sign here</span>}
        </div>
        {isSigned && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">Signed</span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400">Printed Name and Signature — {label}</p>

      {isSigned ? (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar size={12} />
          {new Date(signature.signedAt).toLocaleDateString()} ·{" "}
          {new Date(signature.signedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      ) : (
        <div className="no-print mt-3 flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type full name to sign"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            onClick={handleSign}
            disabled={saving || !name.trim()}
            className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Sign
          </button>
        </div>
      )}
    </div>
  );
};

const AgreementSignature = ({ session, onUpdated }) => {
  const { user } = useAuthStore();

  if (!session) return null;

  const signatures = session.agreement?.signatures || {};

  return (

    <div className="rounded-3xl bg-white p-6 shadow-sm">

      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">3</span>
        <div>
          <h2 className="text-base font-bold text-slate-900">Signatures</h2>
          <p className="text-xs text-slate-400">By signing below, I confirm that the information provided is true and correct.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <SignatureBlock
          sessionId={session.sessionId}
          role="patient"
          label="Patient"
          defaultName={session.patient?.full_name}
          signature={signatures.patient}
          onUpdated={onUpdated}
        />

        <SignatureBlock
          sessionId={session.sessionId}
          role="witness"
          label="Witness"
          signature={signatures.witness}
          onUpdated={onUpdated}
        />

        <SignatureBlock
          sessionId={session.sessionId}
          role="facilityRepresentative"
          label="HD Facility Representative"
          defaultName={user?.username}
          signature={signatures.facilityRepresentative}
          onUpdated={onUpdated}
        />

      </div>

    </div>

  );

};

export default AgreementSignature;
