import { Check, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { updateAgreementHeparin } from "../../api/dialysisSessionApi";
import { agreementInjectionMatches } from "../../utils/agreementInjection";

const HEPARIN_OPTIONS = [
  "Heparin sodium 1000 IU/mL, 5 mL vial",
  "Heparin sodium 5000 IU/mL, 5 mL vial",
  "Heparin sodium 1000 IU/mL, 30 mL vial",
  "Heparin sodium 5000 IU/mL, 30 mL vial",
];
const DEFAULT_HEPARIN = HEPARIN_OPTIONS[1];

const CheckBadge = ({ covered }) =>
  covered ? (
    <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-600">
      <Check size={12} strokeWidth={3} />
    </span>
  ) : (
    <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-slate-400">
      <X size={12} strokeWidth={3} />
    </span>
  );

const AgreementItemsCovered = ({ session, onHeparinChange }) => {
  const [savingHeparin, setSavingHeparin] = useState(false);

  if (!session) return null;

  const hasLab = (lab) =>
    session.laboratories?.some(
      (x) => x.name === lab && x.done
    );
  const selectedHeparin = session.agreement?.heparin || DEFAULT_HEPARIN;
  const injection = (name) => agreementInjectionMatches(session.injection?.name, name);
  const selectHeparin = async (heparin) => {
    if (savingHeparin || heparin === selectedHeparin) return;
    const previousHeparin = selectedHeparin;

    onHeparinChange?.(session.sessionId, heparin);
    setSavingHeparin(true);
    try {
      await updateAgreementHeparin(session.sessionId, heparin);
      toast.success("Heparin selection updated.");
    } catch (error) {
      onHeparinChange?.(session.sessionId, previousHeparin);
      toast.error(error.response?.data?.message || "Failed to update Heparin selection.");
    } finally {
      setSavingHeparin(false);
    }
  };

  return (

    <div className="rounded-xl bg-white shadow-sm">

      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-950 text-[10px] font-bold text-white">1</span>
        <h2 className="text-sm font-bold text-slate-900">Items Covered by PhilHealth</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 p-3 text-[10px] [&_td]:!py-1 md:grid-cols-3">

        {/* ================= DRUGS ================= */}

        <div>

          <h3 className="mb-1.5 text-xs font-bold text-slate-900">
            Drugs / Medicines
          </h3>

          <table className="w-full text-[10px]">

            <tbody className="divide-y divide-slate-100">

              <tr>
                <td colSpan="2" className="pb-1.5 pt-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Epoetin alpha
                </td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">1. 2000 IU / 0.5 mL pre-filled syringe</td>
                <td className="w-8 py-1.5 text-right">
                  <CheckBadge covered={injection("2000 IU / 0.5 mL pre-filled syringe")} />
                </td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">2. 4000 IU / 0.4 mL pre-filled syringe</td>
                <td className="w-8 py-1.5 text-right">
                  <CheckBadge covered={injection("4000 IU / 0.4 mL pre-filled syringe")} />
                </td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">3. 4000 IU / mL, 1mL vial</td>
                <td className="w-8 py-1.5 text-right">
                  <CheckBadge covered={injection("4000 IU / mL, 1mL vial")} />
                </td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">4. 4000 IU / mL solution for injection in 1mL pre-filled syringe</td>
                <td className="w-8 py-1.5 text-right">
                  <CheckBadge covered={injection("4000 IU / mL solution for injection in 1mL pre-filled syringe")} />
                </td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">5. 10000 IU / mL pre-filled syringe</td>
                <td className="w-8 py-1.5 text-right">
                  <CheckBadge covered={injection("10000 IU / mL pre-filled syringe")} />
                </td>
              </tr>

              <tr>
                <td colSpan="2" className="pb-1.5 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Epoetin beta
                </td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">1. 2000 IU / 0.3 mL pre-filled syringe</td>
                <td className="w-8 py-1.5 text-right">
                  <CheckBadge covered={injection("2000 IU / 0.3 mL pre-filled syringe")} />
                </td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">2. 5000 IU / 0.3 mL pre-filled syringe</td>
                <td className="w-8 py-1.5 text-right">
                  <CheckBadge covered={injection("5000 IU / 0.3 mL pre-filled syringe")} />
                </td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">3. 10000 IU / 0.6 mL pre-filled syringe</td>
                <td className="w-8 py-1.5 text-right">
                  <CheckBadge covered={injection("10000 IU / 0.6 mL pre-filled syringe")} />
                </td>
              </tr>

              <tr>
                <td className="py-1.5 pt-3 text-slate-600">Iron Sucrose 20mg/mL</td>
                <td className="w-8 py-1.5 pt-3 text-right">
                  <CheckBadge covered={session.iron.name === "Iron Sucrose 20 mg/mL, 5mL ampule"} />
                </td>
              </tr>

              <tr>
                <td colSpan="2" className="pb-1.5 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Heparin
                </td>
              </tr>
              {HEPARIN_OPTIONS.map((option, index) => (
                <tr key={option}>
                  <td className="py-1.5 pr-2 text-slate-600">
                    <button
                      type="button"
                      disabled={savingHeparin}
                      onClick={() => selectHeparin(option)}
                      className={`w-full rounded-lg px-2 py-1.5 text-left transition ${
                        selectedHeparin === option
                          ? "bg-emerald-50 font-semibold text-emerald-800 ring-1 ring-emerald-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {index + 1}. {option}
                    </button>
                  </td>
                  <td className="w-8 py-1.5 text-right"><CheckBadge covered={selectedHeparin === option} /></td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

        {/* ================= LABORATORY ================= */}

        <div>

          <h3 className="mb-1.5 text-xs font-bold text-slate-900">
            Laboratory Tests
          </h3>

          <table className="w-full text-[10px]">

            <tbody className="divide-y divide-slate-100">

              <tr>
                <td className="py-1.5 text-slate-600">CBC</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={hasLab("CBC")} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Serum Creatinine</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={hasLab("CREA")} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">BUN</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={hasLab("BUN")} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Hepatitis Profile</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={hasLab("HEPA PROFILE")} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Alkaline Phosphatase</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={hasLab("ALKALINE")} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Potassium</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={hasLab("POTASSIUM")} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Phosphorus</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={hasLab("PHOSPHORUS")} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Calcium</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={hasLab("CALCIUM")} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Sodium</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={hasLab("SODIUM")} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Albumin</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={hasLab("ALBUMIN")} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Serum Iron / Ferritin</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={hasLab("SERUM IRON/FERRITIN")} /></td>
              </tr>

            </tbody>

          </table>

        </div>

        {/* ================= SUPPLIES ================= */}

        <div>

          <h3 className="mb-1.5 text-xs font-bold text-slate-900">
            Supplies
          </h3>

          <table className="w-full text-[10px]">

            <tbody className="divide-y divide-slate-100">

              <tr>
                <td className="py-1.5 text-slate-600">Dialyzer, low-flux</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={session.dialyzer.name === "Low Flux"} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Dialyzer, high-flux</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered={session.dialyzer.name === "High Flux"} /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Hemodialysis Solutions</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Dialysis Kit</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered /></td>
              </tr>

            </tbody>

          </table>

          <h3 className="mb-1.5 mt-3 text-xs font-bold text-slate-900">
            Administrative Fees
          </h3>

          <table className="w-full text-[10px]">

            <tbody className="divide-y divide-slate-100">

              <tr>
                <td className="py-1.5 text-slate-600">Use of Hemodialysis Machine</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Facility Fee</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Nursing Service and Staff fee</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered /></td>
              </tr>

              <tr>
                <td className="py-1.5 text-slate-600">Utilities</td>
                <td className="w-8 py-1.5 text-right"><CheckBadge covered /></td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>

      <div className="border-t border-slate-100 px-3 pb-3 pt-3">

        <h3 className="mb-1 text-xs font-bold text-slate-900">
          Copayment (Not Covered by PhilHealth)
        </h3>

        <p className="mb-2 text-[10px] leading-4 text-slate-500">
          I understand that I may be charged a copayment for the following items,
          amenities, additional services, and premium services that are not covered
          by PhilHealth (attach additional sheet as necessary).
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-100">

          <table className="w-full text-[10px]">

            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">

              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-left">Unit / Quantity</th>
                <th className="p-2 text-left">Price (PHP)</th>
              </tr>

            </thead>

            <tbody>

              <tr>
                <td colSpan={3} className="p-3 text-center text-slate-400">
                  No additional charges indicated.
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

};

export default AgreementItemsCovered;
