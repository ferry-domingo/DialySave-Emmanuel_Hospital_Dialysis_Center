import { Check } from "lucide-react";

import CompletionRing from "./CompletionRing";
import { getAgreementChecklist, getAgreementCompletion } from "../../utils/agreementCompletion";

const CompletionStatusCard = ({ session }) => {
  const checklist = getAgreementChecklist(session);
  const percent = getAgreementCompletion(session);

  return (
    <div className="no-print rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-bold text-slate-900">Form Completion Status</p>

      <div className="flex items-center gap-4">
        <CompletionRing percent={percent} />

        <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {checklist.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-xs">
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                  item.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300"
                }`}
              >
                <Check size={10} strokeWidth={3} />
              </span>
              <span className={item.done ? "font-medium text-slate-700" : "text-slate-400"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompletionStatusCard;
