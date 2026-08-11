import { useEffect, useState } from "react";
import { Calendar, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/authStore";
import { signAgreement } from "../../api/dialysisSessionApi";

const SignatureBlock = ({ sessionId, role, label, defaultName, signature }) => {
  const [name, setName] = useState(defaultName || "");
  const [savedName, setSavedName] = useState(signature?.name || defaultName || "");
  const [savedAt, setSavedAt] = useState(signature?.signedAt || null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const accountIdentityLocked = ["patient", "facilityRepresentative"].includes(role) && Boolean(defaultName?.trim());
  const isSigned = Boolean(savedAt) || accountIdentityLocked;
  const signedName = savedName || defaultName;
  const canEditSignedName = ["patient", "facilityRepresentative"].includes(role);

  useEffect(() => {
    const nextName = signature?.name || defaultName || "";
    setName(nextName);
    setSavedName(nextName);
    setSavedAt(signature?.signedAt || null);
    setEditing(false);
  }, [sessionId, signature?.name, signature?.signedAt, defaultName]);

  const handleSign = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);

    try {
      const response = await signAgreement(sessionId, { role, name: name.trim() });
      const savedSignature = response.data?.data?.signatures?.[role];
      setSavedName(savedSignature?.name || name.trim());
      setSavedAt(savedSignature?.signedAt || new Date().toISOString());
      setEditing(false);
      toast.success(`${label} signature recorded`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record signature");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-100 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex h-7 flex-1 items-end border-b border-slate-300 pb-0.5 text-[10px] font-bold text-slate-900">
          {isSigned ? signedName : name || <span className="text-slate-300">Sign here</span>}
        </div>
        {isSigned && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">Signed</span>
        )}
      </div>

      <p className="mt-1.5 text-[9px] text-slate-400">Printed Name and Signature — {label}</p>

      {isSigned && !editing ? (
        <div className="mt-2 flex min-h-8 items-center justify-between gap-2">
          {savedAt ? (
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
              <Calendar size={12} />
              {new Date(savedAt).toLocaleDateString()} ·{" "}
              {new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          ) : (
            <p className="text-[9px] font-medium text-emerald-600">Verified from linked account</p>
          )}
          {canEditSignedName && (
            <button type="button" onClick={() => { setName(signedName || ""); setEditing(true); }} className="no-print flex h-7 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[9px] font-semibold text-slate-600 transition hover:bg-slate-50">
              <Pencil size={11} /> Edit
            </button>
          )}
        </div>
      ) : (
        <div className="no-print mt-2 flex items-center gap-1.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type full name to sign"
            className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-[10px]"
          />
          <button
            onClick={handleSign}
            disabled={saving || !name.trim()}
            className="h-8 shrink-0 rounded-lg bg-slate-950 px-3 text-[10px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {editing ? "Save" : "Sign"}
          </button>
          {editing && (
            <button type="button" onClick={() => { setName(signedName || ""); setEditing(false); }} aria-label={`Cancel editing ${label} signature`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700">
              <X size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const AgreementSignature = ({ session }) => {
  const { user } = useAuthStore();

  if (!session) return null;

  const signatures = session.agreement?.signatures || {};

  return (

    <div className="rounded-xl bg-white p-3 shadow-sm">

      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-950 text-[10px] font-bold text-white">2</span>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Signatures</h2>
          <p className="text-[9px] text-slate-400">By signing below, I confirm that the information provided is true and correct.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">

        <SignatureBlock
          sessionId={session.sessionId}
          role="patient"
          label="Patient"
          defaultName={session.patient?.full_name}
          signature={signatures.patient}
        />

        <SignatureBlock
          sessionId={session.sessionId}
          role="witness"
          label="Witness"
          signature={signatures.witness}
        />

        <SignatureBlock
          sessionId={session.sessionId}
          role="facilityRepresentative"
          label="HD Facility Representative"
          defaultName={user?.username}
          signature={signatures.facilityRepresentative}
        />

      </div>

    </div>

  );

};

export default AgreementSignature;
