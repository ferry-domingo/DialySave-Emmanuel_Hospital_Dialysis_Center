import { Check } from "lucide-react";

import CompletionRing from "./CompletionRing";
import { getAgreementChecklist, getAgreementCompletion } from "../../utils/agreementCompletion";

const CompletionStatusCard = ({ session }) => {
  const checklist = getAgreementChecklist(session);
  const percent = getAgreementCompletion(session);

  return (
    <div className="no-print h-full rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
      <p className="mb-1.5 text-[10px] font-bold text-slate-900">Form Completion Status</p>

      <div className="flex items-center gap-2">
        <CompletionRing percent={percent} />

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          {checklist.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5 text-[9px]">
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
