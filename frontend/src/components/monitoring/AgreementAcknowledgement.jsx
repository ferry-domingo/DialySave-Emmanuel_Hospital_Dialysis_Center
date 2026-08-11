import { useState } from "react";
import { Info } from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/authStore";
import { acknowledgeAgreement } from "../../api/dialysisSessionApi";

const AgreementAcknowledgement = ({ session, onUpdated }) => {
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);

  // Missing/legacy records default to acknowledged (true) rather than unchecked.
  const informedConsent = session.agreement?.acknowledgement?.informedConsent ?? true;
  const itemsAcknowledged = session.agreement?.acknowledgement?.itemsAcknowledged ?? true;

  const handleToggle = async (field) => {
    if (saving) return;
    setSaving(true);

    try {
      await acknowledgeAgreement(session.sessionId, {
        informedConsent: field === "informedConsent" ? !informedConsent : informedConsent,
        itemsAcknowledged: field === "itemsAcknowledged" ? !itemsAcknowledged : itemsAcknowledged,
      });
      await onUpdated?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update acknowledgement");
    } finally {
      setSaving(false);
    }
  };

  return (

    <div className="rounded-xl bg-white shadow-sm">

      <div className="flex items-center gap-2 rounded-t-xl border-b border-slate-100 px-3 py-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-950 text-[10px] font-bold text-white">1</span>
        <h2 className="text-sm font-bold text-slate-900">Agreement Acknowledgement</h2>
      </div>

      <div className="space-y-2 p-3 text-[10px] leading-4">

        <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-slate-600">
          <Info size={14} className="mt-0.5 shrink-0 text-emerald-600" />
          <p>
            This document is intended to verify that you have received adequate information verbally and in writing,
            including PhilHealth's guidelines for availing of the benefits package for hemodialysis (HD). The HD Facility
            should clearly explain to you the significances of the contents of this Agreement Form with adequate details
            you understand.
          </p>
        </div>

        <div className="grid gap-1.5 lg:grid-cols-2">

          <label className="flex items-start gap-2 rounded-lg border border-slate-100 p-2">
            <input
              type="checkbox"
              checked={informedConsent}
              onChange={() => handleToggle("informedConsent")}
              disabled={saving}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            <span className="font-medium text-slate-700">
              I have been informed by Dr./Ms./Mr. {user?.username || "the HD Facility Representative"} of the PhilHealth
              policies on availing of the benefits package for HD. I understand the contents of this agreement.
            </span>
          </label>

          <label className="flex items-start gap-2 rounded-lg border border-slate-100 p-2">
            <input
              type="checkbox"
              checked={itemsAcknowledged}
              onChange={() => handleToggle("itemsAcknowledged")}
              disabled={saving}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            <span className="font-medium text-slate-700">
              By checking this box, you acknowledge that the items indicated below are covered by PhilHealth under the
              HD Benefits Package.
            </span>
          </label>

        </div>

      </div>

    </div>

  );

};

export default AgreementAcknowledgement;
