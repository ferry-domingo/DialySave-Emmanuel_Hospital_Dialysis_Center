import { useAuthStore } from "../../store/authStore";
import { agreementInjectionMatches } from "../../utils/agreementInjection";

const Mark = ({ ok }) => (
  <span className="text-sm font-bold">{ok ? "✓" : "✗"}</span>
);

const PageHeader = () => (
  <img src="/images/header.png" alt="" className="mx-auto mb-6 w-[84%]" />
);

const PageFooter = () => (
  <img src="/images/footer.png" alt="" className="h-8" />
);

const FormTitle = () => (
  <div className="mb-4 text-center leading-none">
    <p className="text-[12px] font-bold">PHILHEALTH HEMODIALYSIS BENEFITS PACKAGE</p>
    <p className="text-[12px] font-bold">AGREEMENT FORM</p>
  </div>
);

const SignatureLine = ({ name, signedAt, caption, dateOffset = false }) => (
  <div>
    <div className="flex h-7 items-end justify-center border-b border-black text-xs font-semibold">
      {name || ""}
    </div>
    <p className="mt-0.5 flex min-h-[22px] items-start justify-center text-center text-[11px] leading-tight">{caption}</p>
    <div className={`mt-2 flex items-center gap-1 text-[11px] ${dateOffset ? "relative top-[6px]" : ""}`}>
      <span>Date:</span>
      <span className="flex-1 border-b border-black px-1">{signedAt ? new Date(signedAt).toLocaleDateString() : ""}</span>
    </div>
  </div>
);

const AgreementPrintDocument = ({ session }) => {
  const { user } = useAuthStore();

  if (!session) return null;

  const hasLab = (lab) => session.laboratories?.some((x) => x.name === lab && x.done);
  const injection = (name) => agreementInjectionMatches(session.injection?.name, name);
  const iron = session.iron?.name === "Iron Sucrose 20 mg/mL, 5mL ampule";
  const dialyzer = (name) => session.dialyzer?.name === name;
  const heparin = (name) =>
    (session.agreement?.heparin || "Heparin sodium 5000 IU/mL, 5 mL vial") === name;

  const signatures = session.agreement?.signatures || {};

  return (
    <div className="mx-auto max-w-[850px] bg-white font-serif text-black">

      {/* ================= PAGE 1 ================= */}
      <div className="agreement-print-page space-y-1">

        <PageHeader />
        <FormTitle />

        <div className="flex justify-between text-[11px]">
          <p><span className="font-semibold">HD Treatment Session No.</span> {session.sessionNo}</p>
          <p><span className="font-semibold">Date (Month/Day/Year):</span> {new Date(session.date).toLocaleDateString()}</p>
        </div>

        <div className="space-y-2 text-justify text-[11px] leading-[1.45]">
          <p>
            This document is intended to verify that you have received adequate information verbally and in writing,
            including PhilHealth's guidelines for availing of the benefits package for hemodialysis (HD). The HD
            Facility should clearly explain to you the significance of the contents of this Agreement Form in the
            language that you understand and will furnish you a copy of this form for each unique treatment session.
          </p>
          <p>
            I have been fully informed by Dr./Ms./Mr. {user?.username || "the HD Facility Representative"} of
            the PhilHealth policies on availing of the benefits package for HD.
          </p>
          <p>
            I understand that PhilHealth provides coverage for up to 156 treatment sessions per calendar year for
            patients with chronic kidney disease (CKD5).
          </p>
          <p>
            I understand that the HD package provides coverage for the minimum standards required by CKD5 patients,
            as enumerated in the applicable PhilHealth policy.
          </p>
          <p>
            I understand that the package rate for HD is PHP 6,350 per treatment session. This includes the fee for
            the health facility and the professional.
          </p>
          <p>
            I understand that the provision of items and services depends on the patient's status; therefore, I have
            been informed which items are clinically indicated. Please check (✓) if indicated and cross mark (✗) if
            not indicated for the below-listed items and services covered by PhilHealth for hemodialysis.
          </p>
        </div>

        <table className="w-full border border-black text-[10px] leading-[1.05]">
          <thead>
            <tr>
              <th className="border border-black px-1.5 py-px text-left">Items Covered by PhilHealth</th>
              <th className="w-2/5 border border-black px-1.5 py-px text-center">
                Put a check (✓) if indicated and cross mark (✗) if not indicated
              </th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={2} className="border border-black px-1.5 py-px font-semibold">Drugs / Medicine</td></tr>

            <tr><td className="border border-black px-1.5 py-px pl-3 font-semibold">Epoetin alpha (Human Recombinant Erythropoietin)</td><td className="border border-black"></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">1. 2000 IU / 0.5 mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("2000 IU / 0.5 mL pre-filled syringe")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">2. 4000 IU / 0.4 mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("4000 IU / 0.4 mL pre-filled syringe")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">3. 4000 IU / mL, 1mL vial</td><td className="border border-black text-center"><Mark ok={injection("4000 IU / mL, 1mL vial")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">4. 4000 IU / mL solution for injection in 1mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("4000 IU / mL solution for injection in 1mL pre-filled syringe")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">5. 10,000 IU / mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("10000 IU / mL pre-filled syringe")} /></td></tr>

            <tr><td className="border border-black px-1.5 py-px pl-3 font-semibold">Epoetin beta (Human Recombinant Erythropoietin)</td><td className="border border-black"></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">1. 2000 IU / 0.3 mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("2000 IU / 0.3 mL pre-filled syringe")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">2. 5000 IU / 0.3 mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("5000 IU / 0.3 mL pre-filled syringe")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">3. 10,000 IU / 0.6 mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("10000 IU / 0.6 mL pre-filled syringe")} /></td></tr>

            <tr><td className="border border-black px-1.5 py-px pl-3 font-semibold">Iron Sucrose 20 mg/mL, 5mL ampule</td><td className="border border-black text-center"><Mark ok={iron} /></td></tr>

            <tr><td className="border border-black px-1.5 py-px pl-3 font-semibold">Heparin</td><td className="border border-black"></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">1. Heparin sodium 1000 IU/mL, 5 mL vial</td><td className="border border-black text-center"><Mark ok={heparin("Heparin sodium 1000 IU/mL, 5 mL vial")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">2. Heparin sodium 5000 IU/mL, 5 mL vial</td><td className="border border-black text-center"><Mark ok={heparin("Heparin sodium 5000 IU/mL, 5 mL vial")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">3. Heparin sodium 1000 IU/mL, 30 mL vial</td><td className="border border-black text-center"><Mark ok={heparin("Heparin sodium 1000 IU/mL, 30 mL vial")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-5">4. Heparin sodium 5000 IU/mL, 30 mL vial</td><td className="border border-black text-center"><Mark ok={heparin("Heparin sodium 5000 IU/mL, 30 mL vial")} /></td></tr>

            <tr><td colSpan={2} className="border border-black px-1.5 py-px font-semibold">Laboratory tests</td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">1. Complete blood count</td><td className="border border-black text-center"><Mark ok={hasLab("CBC")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">2. Serum creatinine</td><td className="border border-black text-center"><Mark ok={hasLab("CREA")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">3. BUN</td><td className="border border-black text-center"><Mark ok={hasLab("BUN")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">4. Hepatitis profile</td><td className="border border-black text-center"><Mark ok={hasLab("HEPA PROFILE")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">5. Alkaline phosphatase</td><td className="border border-black text-center"><Mark ok={hasLab("ALKALINE")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">6. Potassium</td><td className="border border-black text-center"><Mark ok={hasLab("POTASSIUM")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">7. Phosphorus</td><td className="border border-black text-center"><Mark ok={hasLab("PHOSPHORUS")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">8. Calcium</td><td className="border border-black text-center"><Mark ok={hasLab("CALCIUM")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">9. Sodium</td><td className="border border-black text-center"><Mark ok={hasLab("SODIUM")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">10. Serum iron / ferritin / transferrin, total iron binding capacity</td><td className="border border-black text-center"><Mark ok={hasLab("SERUM IRON/FERRITIN")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">11. Albumin</td><td className="border border-black text-center"><Mark ok={hasLab("ALBUMIN")} /></td></tr>
          </tbody>
        </table>

        <div className="flex justify-start pt-0.5">
          <PageFooter />
        </div>

      </div>

      {/* ================= PAGE 2 ================= */}
      <div className="agreement-print-page space-y-1">

        <PageHeader />

        <table className="w-full border border-black text-[10px] leading-[1.05]">
          <thead>
            <tr>
              <th className="border border-black px-1.5 py-px text-left">Items Covered by PhilHealth</th>
              <th className="w-2/5 border border-black px-1.5 py-px text-center">
                Put a check (✓) if indicated and cross mark (✗) if not indicated
              </th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={2} className="border border-black px-1.5 py-px font-semibold">Supplies</td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">Dialyzer, low-flux</td><td className="border border-black text-center"><Mark ok={dialyzer("Low Flux")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">Dialyzer, high-flux</td><td className="border border-black text-center"><Mark ok={dialyzer("High Flux")} /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">Hemodialysis Solutions</td><td className="border border-black text-center"><Mark ok /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">Dialysis Kit</td><td className="border border-black text-center"><Mark ok /></td></tr>

            <tr><td colSpan={2} className="border border-black px-1.5 py-px font-semibold">Administrative &amp; Other fees</td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">Use of Hemodialysis Machine</td><td className="border border-black text-center"><Mark ok /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">Facility Fee</td><td className="border border-black text-center"><Mark ok /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">Nursing Service and Staff fee</td><td className="border border-black text-center"><Mark ok /></td></tr>
            <tr><td className="border border-black px-1.5 py-px pl-3">Utilities</td><td className="border border-black text-center"><Mark ok /></td></tr>
          </tbody>
        </table>

        <p className="text-justify text-[11px] leading-[1.45]">
          I understand that I may be charged a copayment for the following items, amenities, additional services,
          and premium services that are not covered by PhilHealth (attach additional sheet as necessary).
        </p>

        <table className="w-full border border-black text-[10px]">
          <thead>
            <tr>
              <th className="border border-black px-1.5 py-px text-left">Item</th>
              <th className="border border-black px-1.5 py-px text-left">Unit/Quantity</th>
              <th className="border border-black px-1.5 py-px text-left">Price (PHP)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="h-4 border border-black px-1.5"></td><td className="border border-black px-1.5"></td><td className="border border-black px-1.5"></td></tr>
            <tr><td className="h-4 border border-black px-1.5"></td><td className="border border-black px-1.5"></td><td className="border border-black px-1.5"></td></tr>
            <tr><td className="h-4 border border-black px-1.5"></td><td className="border border-black px-1.5"></td><td className="border border-black px-1.5"></td></tr>
            <tr className="font-semibold"><td colSpan={2} className="border border-black px-1.5 py-px text-right">Total</td><td className="border border-black px-1.5"></td></tr>
          </tbody>
        </table>

        <p className="text-[11px] leading-[1.45]">
          I have been furnished with a list of possible funding sources for medical assistance that may complement
          the PhilHealth benefits for HD.
        </p>

        <p className="text-[11px] font-bold">Conforme:</p>

        <div className="grid grid-cols-2 gap-8 pt-0.5">
          <SignatureLine
            name={signatures.patient?.name}
            signedAt={signatures.patient?.signedAt}
            caption="Printed name and signature of patient"
            dateOffset
          />
          <SignatureLine
            name={signatures.facilityRepresentative?.name}
            signedAt={signatures.facilityRepresentative?.signedAt}
            caption={<>Printed name and signature<br />HD Facility Representative</>}
          />
        </div>

        <div className="w-1/2 pt-1">
          <p className="mb-0.5 text-[11px] font-bold">Witness:</p>
          <SignatureLine
            name={signatures.witness?.name}
            signedAt={signatures.witness?.signedAt}
            caption="Printed name and signature"
          />
        </div>

        <div className="flex justify-start pt-1">
          <PageFooter />
        </div>

      </div>

    </div>
  );
};

export default AgreementPrintDocument;
