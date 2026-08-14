import { Check, Copy, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import Modal from "./Modal";

const CredentialsModal = ({ credentials, accountType, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  if (!credentials) return null;

  const copy = async (value, label) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <Modal isOpen onClose={onClose} maxWidth="max-w-md" title={`${accountType} Login Credentials`}>
      <div className="space-y-3">
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
          <ShieldCheck size={17} className="mt-0.5 shrink-0" />
          <p>Save these credentials now. The temporary password cannot be viewed again after this window is closed.</p>
        </div>

        <div className="space-y-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Login ID</p>
            <div className="mt-1 flex items-center justify-between gap-2"><strong className="break-all text-sm text-slate-900">{credentials.loginId}</strong><button type="button" onClick={() => copy(credentials.loginId, "Login ID")} aria-label="Copy login ID" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-emerald-600"><Copy size={15} /></button></div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Temporary Password</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <strong className="break-all text-sm text-slate-900">{showPassword ? credentials.temporaryPassword : "••••••••••••"}</strong>
              <div className="flex shrink-0"><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide temporary password" : "View temporary password"} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-600">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button><button type="button" onClick={() => copy(credentials.temporaryPassword, "Temporary password")} aria-label="Copy temporary password" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-emerald-600"><Copy size={15} /></button></div>
            </div>
          </div>
        </div>

        <button type="button" onClick={onClose} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#116149] text-xs font-bold text-white hover:bg-[#0e513e]"><Check size={15} /> I saved the credentials</button>
      </div>
    </Modal>
  );
};

export default CredentialsModal;
