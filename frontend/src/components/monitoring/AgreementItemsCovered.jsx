import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { updateAgreementCopayments, updateAgreementHeparin } from "../../api/dialysisSessionApi";
import { agreementInjectionMatches } from "../../utils/agreementInjection";
import Modal from "../common/Modal";
import Input from "../common/Input";

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

const AgreementItemsCovered = ({ session, onHeparinChange, onCopaymentsChange }) => {
  const [savingHeparin, setSavingHeparin] = useState(false);
  const [copaymentModalOpen, setCopaymentModalOpen] = useState(false);
  const [savingCopayment, setSavingCopayment] = useState(false);
  const [editingCopaymentIndex, setEditingCopaymentIndex] = useState(null);
  const [copaymentForm, setCopaymentForm] = useState({ item: "", unitQuantity: "", price: "" });

  if (!session) return null;

  const hasLab = (lab) =>
    session.laboratories?.some(
      (x) => x.name === lab && x.done
    );
  const selectedHeparin = session.agreement?.heparin || DEFAULT_HEPARIN;
  const copayments = session.agreement?.copayments || [];
  const copaymentTotal = copayments.reduce((sum, entry) => sum + Number(entry.price || 0), 0);
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

  const saveCopayments = async (items, successMessage) => {
    setSavingCopayment(true);
    try {
      const response = await updateAgreementCopayments(session.sessionId, items);
      const savedItems = response.data?.data?.copayments || items;
      onCopaymentsChange?.(session.sessionId, savedItems);
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update copayment items.");
      return false;
    } finally {
      setSavingCopayment(false);
    }
  };

  const saveCopayment = async (event) => {
    event.preventDefault();
    const price = Number(copaymentForm.price);
    if (!copaymentForm.item.trim() || !copaymentForm.unitQuantity.trim() || !Number.isFinite(price) || price < 0) {
      toast.error("Complete all fields with a valid price.");
      return;
    }
    const nextItem = { item: copaymentForm.item.trim(), unitQuantity: copaymentForm.unitQuantity.trim(), price };
    const nextItems = editingCopaymentIndex === null
      ? [...copayments, nextItem]
      : copayments.map((entry, index) => index === editingCopaymentIndex ? nextItem : entry);
    const saved = await saveCopayments(nextItems, editingCopaymentIndex === null ? "Copayment item added." : "Copayment item updated.");
    if (saved) {
      setCopaymentForm({ item: "", unitQuantity: "", price: "" });
      setEditingCopaymentIndex(null);
      setCopaymentModalOpen(false);
    }
  };

  const openAddCopayment = () => {
    setEditingCopaymentIndex(null);
    setCopaymentForm({ item: "", unitQuantity: "", price: "" });
    setCopaymentModalOpen(true);
  };

  const openEditCopayment = (entry, index) => {
    setEditingCopaymentIndex(index);
    setCopaymentForm({ item: entry.item, unitQuantity: entry.unitQuantity, price: String(entry.price) });
    setCopaymentModalOpen(true);
  };

  const closeCopaymentModal = () => {
    if (savingCopayment) return;
    setCopaymentModalOpen(false);
    setEditingCopaymentIndex(null);
    setCopaymentForm({ item: "", unitQuantity: "", price: "" });
  };

  const removeCopayment = (index) => {
    saveCopayments(copayments.filter((_, itemIndex) => itemIndex !== index), "Copayment item removed.");
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
                      className={`w-full rounded-lg px-2 py-1.5 text-left transition ${selectedHeparin === option
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

        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-900">Copayment (Not Covered by PhilHealth)</h3>
          <button type="button" onClick={openAddCopayment} className="inline-flex h-7 items-center gap-1 rounded-lg bg-slate-950 px-2.5 text-[10px] font-semibold text-white transition hover:bg-slate-800">
            <Plus size={13} /> Add Item
          </button>
        </div>

        <p className="mb-2 text-[10px] leading-4 text-slate-500">
          I understand that I may be charged a copayment for the following items,
          amenities, additional services, and premium services that are not covered
          by PhilHealth (attach additional sheet as necessary).
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-100">

          <table className="w-full text-[10px]">

            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">

              <tr>
                <th className="p-2 text-center">Item</th>
                <th className="p-2 text-left">Unit / Quantity</th>
                <th className="p-2 text-center">Price (PHP)</th>
                <th className="w-9" aria-label="Actions" />
              </tr>

            </thead>

            <tbody>

              {copayments.length === 0 ? (
                <tr><td colSpan={4} className="p-3 text-center text-slate-400">No additional charges indicated.</td></tr>
              ) : copayments.map((entry, index) => (
                <tr key={entry._id || `${entry.item}-${index}`} className="border-t border-slate-100">
                  <td className="p-2 text-center text-slate-700">{entry.item}</td>
                  <td className="p-2 text-slate-700">{entry.unitQuantity}</td>
                  <td className="p-2 text-center font-semibold text-slate-800">{Number(entry.price).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="w-16 p-1"><div className="flex justify-center gap-0.5"><button type="button" disabled={savingCopayment} onClick={() => openEditCopayment(entry, index)} aria-label={`Edit ${entry.item}`} className="grid h-7 w-7 place-items-center rounded-md text-blue-600 hover:bg-blue-50 disabled:opacity-50"><Pencil size={13} /></button><button type="button" disabled={savingCopayment} onClick={() => removeCopayment(index)} aria-label={`Remove ${entry.item}`} className="grid h-7 w-7 place-items-center rounded-md text-rose-500 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={13} /></button></div></td>
                </tr>
              ))}

              <tr className="border-t border-slate-200 bg-slate-50 font-bold">
                <td className="p-2 text-left">Total</td>
                <td className="p-2 text-left" />
                <td className="p-2 text-center text-slate-900">PHP {copayments.length === 0 ? "0.00" : copaymentTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-2" />
              </tr>

            </tbody>

          </table>

        </div>

      </div>

      <Modal isOpen={copaymentModalOpen} onClose={closeCopaymentModal} title={editingCopaymentIndex === null ? "Add Copayment Item" : "Edit Copayment Item"} maxWidth="max-w-md">
        <form onSubmit={saveCopayment} className="space-y-3">
          <Input label="Item" required value={copaymentForm.item} onChange={(event) => setCopaymentForm((form) => ({ ...form, item: event.target.value }))} placeholder="Enter item or service" />
          <Input label="Unit / Quantity" required value={copaymentForm.unitQuantity} onChange={(event) => setCopaymentForm((form) => ({ ...form, unitQuantity: event.target.value }))} />
          <Input label="Price (PHP)" required type="number" min="0" step="0.01" value={copaymentForm.price} onChange={(event) => setCopaymentForm((form) => ({ ...form, price: event.target.value }))} placeholder="0.00" />
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" disabled={savingCopayment} onClick={closeCopaymentModal} className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={savingCopayment} className="h-8 rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white disabled:opacity-50">{savingCopayment ? "Saving..." : editingCopaymentIndex === null ? "Add Item" : "Save Changes"}</button>
          </div>
        </form>
      </Modal>

    </div>

  );

};

export default AgreementItemsCovered;
