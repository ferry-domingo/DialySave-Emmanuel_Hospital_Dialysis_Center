import { useAuthStore } from "../../store/authStore";
import { agreementInjectionMatches } from "../../utils/agreementInjection";
import { agreementDialyzerMatches, agreementIronMatches } from "../../utils/agreementTreatmentMappings";
import { patientName, signatureDate, signatureName, userName } from "../../utils/agreementSignatures";

const properName = (value) => value
  .toLocaleLowerCase()
  .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase());

const formatSignatureDate = (value) => value
  ? new Date(value).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  : "";

const Mark = ({ ok }) => (
  <span className="agreement-item-mark text-sm font-bold">{ok ? "✓" : "✗"}</span>
);

const PageHeader = ({ className = "" }) => (
  <img src="/images/header.png" alt="" className={`agreement-print-header mx-auto mb-6 w-[84%] ${className}`} />
);

const PageFooter = () => (
  <img src="/images/footer.png" alt="" className="h-14" />
);

const FormTitle = ({ className = "" }) => (
  <div className={`mb-4 text-center leading-none ${className}`}>
    <p className="agreement-print-benefits-title text-[10pt] font-bold">PHILHEALTH HEMODIALYSIS BENEFITS PACKAGE</p>
    <p className="agreement-print-form-title text-[12px] font-bold">AGREEMENT FORM</p>
  </div>
);

const signatureImageStyle = (placement = {}) => ({
  transform: `translateX(calc(-50% + ${Number(placement.x) || 0}px)) translateY(${Number(placement.y) || 0}px) scale(${Number(placement.scale) || 1})`,
  transformOrigin: "center bottom",
});

const SignatureLine = ({ name, image, placement, signedAt, caption, dateOffset = false, captionAlign = "center", captionDoubleSpace = false, className = "", nameLineClassName = "w-full", dateLineClassName = "w-full" }) => (
  <div className={className}>
    <div className={`relative flex h-7 items-end justify-center border-b border-black text-xs font-normal ${nameLineClassName}`}>
      {image && <img src={image} alt="" className="absolute bottom-0 left-1/2 z-10 max-h-18 max-w-full object-contain" style={signatureImageStyle(placement)} />}
      <span className="relative z-[1]">{name?.toLocaleUpperCase() || ""}</span>
    </div>
    <p className={`mt-0.5 flex min-h-[22px] items-start text-[11px] leading-tight ${captionAlign === "left" ? "justify-start text-left" : "justify-center text-center"} ${captionDoubleSpace ? "agreement-signature-caption-double-space" : ""}`}>{caption}</p>
    <div className={`mt-2 flex items-center gap-1 text-[11px] ${dateLineClassName} ${dateOffset ? "relative top-[6px]" : ""}`}>
      <span>Date:</span>
      <span className="flex-1 border-b border-black px-1 text-center">{formatSignatureDate(new Date())}</span>
    </div>
  </div>
);

const AgreementPrintDocument = ({ session }) => {
  const { user } = useAuthStore();

  if (!session) return null;

  const hasLab = (lab) => session.laboratories?.some((x) => x.name === lab && x.done);
  const injection = (name) => agreementInjectionMatches(session.injection?.name, name);
  const iron = agreementIronMatches(session.iron?.name);
  const dialyzer = (name) => agreementDialyzerMatches(session.dialyzer?.name, name);
  const heparin = (name) =>
    (session.agreement?.heparin || "Heparin sodium 5000 IU/mL, 5 mL vial") === name;

  const signatures = session.agreement?.signatures || {};
  const copayments = session.agreement?.copayments || [];
  const copaymentTotal = copayments.reduce((sum, entry) => sum + Number(entry.price || 0), 0);
  const patientSignatureName = signatureName(signatures.patient, patientName(session.patient));
  const representativeDisplayName = userName(user)
    ? properName(userName(user))
    : "the HD Facility Representative";
  const representativeSignatureName = signatureName(signatures.facilityRepresentative, representativeDisplayName);

  return (
    <div className="agreement-print-document mx-auto max-w-[850px] bg-white font-serif text-black">

      {/* ================= PAGE 1 ================= */}
      <div className="agreement-print-page agreement-print-page-first space-y-1">

        <PageHeader className="agreement-print-first-header" />
        <FormTitle className="agreement-print-first-title" />

        <div className="pl-[4pt] text-[11px] leading-tight">
          <p className="relative">
            <span className="font-semibold">HD Treatment Session No.</span>
            <span className="absolute left-1/2 ml-[16pt] -translate-x-1/2 text-center">{session.sessionNo}</span>
          </p>
          <p className="relative">
            <span className="font-semibold">Date (Month/Day/Year):</span>
            <span className="absolute left-1/2 ml-[16pt] -translate-x-1/2 whitespace-nowrap text-center">
              {new Date(session.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </p>
        </div>

        <div className="agreement-print-first-intro space-y-2 pl-[4pt] text-left text-[11pt] leading-[1.2]">
          <p>
            <span className="block whitespace-nowrap">This document is intended to verify that you have received adequate information verbally and in writing,</span>
            <span className="block whitespace-nowrap">including PhilHealth's guidelines for availing of the benefits package for hemodialysis (HD). The HD Facility</span>
            <span className="block whitespace-nowrap">should clearly explain to you the significances of the contents of this Agreement Form in the language that you</span>
            <span className="block whitespace-nowrap">understand and will furnish you with a copy of the form for each unique treatment session.</span>
          </p>
          <p>
            <span className="block whitespace-nowrap">I have been fully informed by Dr./Ms./Mr. <span className="underline underline-offset-2">{representativeSignatureName}</span> of the PhilHealth policies on availing of the</span>
            <span className="block whitespace-nowrap">benefits package for HD.</span>
          </p>
          <p>
            <span className="block whitespace-nowrap">I understand that PhilHealth covers up to 156 treatment sessions per calendar year for patients with chronic</span>
            <span className="block whitespace-nowrap">kidney stage 5 (CKD5).</span>
          </p>
          <p>
            <span className="block whitespace-nowrap">I understand that the HD package provides coverage for the minimum standards required by CKD5 patients,</span>
            <span className="block whitespace-nowrap">as enumerated in the applicable PhilHealth policy.</span>
          </p>
          <p>
            <span className="block whitespace-nowrap">I understand that the package rate for HD is PHP 6,350 per treatment session. This includes the fee for the</span>
            <span className="block whitespace-nowrap">health facility and the professional.</span>
          </p>
          <p>
            <span className="block whitespace-nowrap">I understand that the provision of the services depends on the patient's status; therefore, I will receive the</span>
            <span className="block whitespace-nowrap">following service that are clinically indicated and necessary for my treatment session:</span>
            <span className="hidden">I understand that the provision of items and services depends on the patient's status; therefore, I have
            been informed which items are clinically indicated. Please check (✓) if indicated and cross mark (✗) if
            not indicated for the below-listed items and services covered by PhilHealth for hemodialysis.</span>
          </p>
        </div>

        <table className="agreement-benefits-table agreement-print-first-table w-full border border-black text-[10px] leading-[1.05]">
          <thead>
            <tr className="agreement-coverage-header">
              <th className="agreement-items-header border border-black px-1.5 py-px text-center align-top">Items Covered by PhilHealth</th>
              <th className="w-[44%] border border-black px-1.5 py-px text-center">
                Put a check (✓) if indicated and cross mark (✗) if not indicated
              </th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={2} className="border border-black py-px pl-[2pt] pr-1.5 font-semibold">Drugs / Medicine</td></tr>

            <tr><td className="border border-black py-px pl-[2pt] pr-1.5 font-normal">Epoetin alpha (Human Recombinant Erythropoietin)</td><td className="border border-black"></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">1. 2000 IU / 0.5 mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("2000 IU / 0.5 mL pre-filled syringe")} /></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">2. 4000 IU / 0.4 mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("4000 IU / 0.4 mL pre-filled syringe")} /></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">3. 4000 IU / mL, 1mL vial</td><td className="border border-black text-center"><Mark ok={injection("4000 IU / mL, 1mL vial")} /></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">4. 4000 IU / mL solution for injection in 1mL syringe</td><td className="border border-black text-center"><Mark ok={injection("4000 IU / mL solution for injection in 1mL pre-filled syringe")} /></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">5. 10,000 IU / mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("10000 IU / mL pre-filled syringe")} /></td></tr>

            <tr><td className="border border-black py-px pl-[2pt] pr-1.5 font-normal">Epoetin beta (Human Recombinant Erythropoietin)</td><td className="border border-black"></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">1. 2000 IU / 0.3 mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("2000 IU / 0.3 mL pre-filled syringe")} /></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">2. 5000 IU / 0.3 mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("5000 IU / 0.3 mL pre-filled syringe")} /></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">3. 10,000 IU / 0.6 mL pre-filled syringe</td><td className="border border-black text-center"><Mark ok={injection("10000 IU / 0.6 mL pre-filled syringe")} /></td></tr>

            <tr><td className="border border-black py-px pl-[2pt] pr-1.5 font-normal">Iron Sucrose 20 mg/mL, 5mL ampule</td><td className="border border-black text-center"><Mark ok={iron} /></td></tr>

            <tr><td className="border border-black py-px pl-[2pt] pr-1.5 font-normal">Heparin</td><td className="border border-black"></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">1. Heparin sodium 1000 IU/mL, 5 mL vial</td><td className="border border-black text-center"><Mark ok={heparin("Heparin sodium 1000 IU/mL, 5 mL vial")} /></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">2. Heparin sodium 5000 IU/mL, 5 mL vial</td><td className="border border-black text-center"><Mark ok={heparin("Heparin sodium 5000 IU/mL, 5 mL vial")} /></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">3. Heparin sodium 1000 IU/mL, 30 mL vial</td><td className="border border-black text-center"><Mark ok={heparin("Heparin sodium 1000 IU/mL, 30 mL vial")} /></td></tr>
            <tr><td className="border border-black py-px pl-[12%] pr-1.5 text-left">4. Heparin sodium 5000 IU/mL, 30 mL vial</td><td className="border border-black text-center"><Mark ok={heparin("Heparin sodium 5000 IU/mL, 30 mL vial")} /></td></tr>

            <tr><td colSpan={2} className="border border-black py-px pl-[2pt] pr-1.5 font-semibold">Laboratory Request</td></tr>
            <tr className="agreement-lab-row"><td className="border border-black px-1.5 py-px pl-3">1. Complete blood count</td><td className="border border-black text-center"><Mark ok={hasLab("CBC")} /></td></tr>
            <tr className="agreement-lab-row"><td className="border border-black px-1.5 py-px pl-3">2. Serum creatinine</td><td className="border border-black text-center"><Mark ok={hasLab("CREA")} /></td></tr>
            <tr className="agreement-lab-row"><td className="border border-black px-1.5 py-px pl-3">3. BUN</td><td className="border border-black text-center"><Mark ok={hasLab("BUN")} /></td></tr>
            <tr className="agreement-lab-row"><td className="border border-black px-1.5 py-px pl-3">4. Hepatitis profile</td><td className="border border-black text-center"><Mark ok={hasLab("HEPA PROFILE")} /></td></tr>
            <tr className="agreement-lab-row"><td className="border border-black px-1.5 py-px pl-3">5. Alkaline phosphatase</td><td className="border border-black text-center"><Mark ok={hasLab("ALKALINE")} /></td></tr>
            <tr className="agreement-lab-row"><td className="border border-black px-1.5 py-px pl-3">6. Potassium</td><td className="border border-black text-center"><Mark ok={hasLab("POTASSIUM")} /></td></tr>
            <tr className="agreement-lab-row"><td className="border border-black px-1.5 py-px pl-3">7. Phosphorus</td><td className="border border-black text-center"><Mark ok={hasLab("PHOSPHORUS")} /></td></tr>
            <tr className="agreement-lab-row"><td className="border border-black px-1.5 py-px pl-3">8. Calcium</td><td className="border border-black text-center"><Mark ok={hasLab("CALCIUM")} /></td></tr>
            <tr className="agreement-lab-row"><td className="border border-black px-1.5 py-px pl-3">9. Sodium</td><td className="border border-black text-center"><Mark ok={hasLab("SODIUM")} /></td></tr>
            <tr className="agreement-lab-row"><td className="border border-black px-1.5 py-px pl-3">10. Serum iron / ferritin / transferrin, total iron binding capacity</td><td className="border border-black text-center"><Mark ok={hasLab("SERUM IRON/FERRITIN")} /></td></tr>
            <tr className="agreement-lab-row"><td className="border border-black px-1.5 py-px pl-3">11. Albumin</td><td className="border border-black text-center"><Mark ok={hasLab("ALBUMIN")} /></td></tr>
          </tbody>
        </table>

        <div className="agreement-print-first-footer flex justify-start pt-0.5">
          <PageFooter />
        </div>

      </div>

      {/* ================= PAGE 2 ================= */}
      <div className="agreement-print-page space-y-1">

        <PageHeader />

        <table className="agreement-benefits-table w-full border border-black text-[10px] leading-[1.05]">
          <thead>
            <tr className="agreement-coverage-header">
              <th className="agreement-items-header border border-black px-1.5 py-px text-center align-top">Items Covered by PhilHealth</th>
              <th className="w-[44%] border border-black px-1.5 py-px text-center">
                Put a check (✓) if indicated and cross mark (✗) if not indicated
              </th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={2} className="border border-black py-px pl-[2pt] pr-1.5 font-semibold">Supplies</td></tr>
            <tr><td className="border border-black py-px pl-[2pt] pr-1.5">Dialyzer, low-flux</td><td className="border border-black text-center"><Mark ok={dialyzer("Low Flux")} /></td></tr>
            <tr><td className="border border-black py-px pl-[2pt] pr-1.5">Dialyzer, high-flux</td><td className="border border-black text-center"><Mark ok={dialyzer("High Flux")} /></td></tr>
            <tr><td className="border border-black py-px pl-[2pt] pr-1.5">Hemodialysis Solutions</td><td className="border border-black text-center"><Mark ok /></td></tr>
            <tr><td className="border border-black py-px pl-[2pt] pr-1.5">Dialysis Kit</td><td className="border border-black text-center"><Mark ok /></td></tr>

            <tr><td colSpan={2} className="border border-black py-px pl-[2pt] pr-1.5 font-semibold">Administrative &amp; Other fees, specify:</td></tr>
            <tr><td className="border border-black px-1.5 py-px text-center">Use of Hemodialysis Machine</td><td className="border border-black text-center"><Mark ok /></td></tr>
            <tr><td className="border border-black px-1.5 py-px text-center">Facility Fee</td><td className="border border-black text-center"><Mark ok /></td></tr>
            <tr><td className="border border-black px-1.5 py-px text-center">Nursing Service and Staff fee</td><td className="border border-black text-center"><Mark ok /></td></tr>
            <tr><td className="border border-black px-1.5 py-px text-center">Utilities</td><td className="border border-black text-center"><Mark ok /></td></tr>
          </tbody>
        </table>

        <p className="agreement-copayment-paragraph text-left text-[11px] leading-[1.45]">
          I understand that I may be charged a copayment for the following items, amenities, additional services,
          and premium services that are not covered by PhilHealth (attach additional sheet as necessary).
        </p>

        <table
          className="agreement-copayment-table w-full table-fixed border border-black text-[11pt]"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          <colgroup>
            <col className="w-[47.25%]" />
            <col className="w-[17%]" />
            <col className="w-[35.75%]" />
          </colgroup>
          <thead>
            <tr>
              <th className="border border-black px-1.5 py-px text-center">Item</th>
              <th className="border border-black px-1.5 py-px text-center">Unit/Quantity</th>
              <th className="border border-black px-1.5 py-px text-center">Price (PHP)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(3, copayments.length) }, (_, index) => {
              const entry = copayments[index];
              return (
                <tr key={entry?._id || index}>
                  <td className="border border-black px-1.5 text-center">{entry?.item || ""}</td>
                  <td className="border border-black px-1.5 text-center">{entry?.unitQuantity || ""}</td>
                  <td className="border border-black px-1.5 text-center">{entry ? Number(entry.price).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}</td>
                </tr>
              );
            })}
            <tr className="font-semibold">
              <td className="border border-black px-1.5"></td>
              <td className="border border-black px-1.5"></td>
              <td className="relative border border-black px-1.5 py-px">
                <span className="absolute top-[2px] left-1.5">Total</span>
                <span className="block text-center">{copayments.length ? copaymentTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <p className="agreement-funding-paragraph text-left text-[11px] leading-[1.45]">
          I have been furnished with a list of possible funding sources for medical assistance that may complement
          the PhilHealth benefits for HD.
        </p>

        <p className="agreement-conforme-label text-[11px] font-normal">Conforme:</p>

        <div className="grid grid-cols-2 gap-8 pt-0.5">
          <SignatureLine
            name={patientSignatureName}
            signedAt={signatureDate(signatures.patient)}
            caption="Printed name and signature of patient"
            captionAlign="left"
            captionDoubleSpace
            dateOffset
            nameLineClassName="w-[75%]"
            dateLineClassName="w-[75%]"
          />
          <SignatureLine
            name={representativeSignatureName}
            image={signatures.facilityRepresentative?.image}
            placement={signatures.facilityRepresentative?.placement}
            signedAt={signatureDate(signatures.facilityRepresentative)}
            caption={<>Printed name and signature<br />HD Facility Representative</>}
            captionAlign="left"
            className="agreement-facility-signature"
          />
        </div>

        <div className="agreement-witness-section w-full pt-1">
          <p className="agreement-witness-label mb-0.5 text-[11px] font-normal">Witness:</p>
          <div className="grid grid-cols-2 gap-x-8">
            <div className="relative flex h-7 w-[75%] items-end justify-center border-b border-black text-xs font-normal">
              <span className="relative z-[1]">{signatureName(signatures.witness)?.toLocaleUpperCase() || ""}</span>
            </div>
            <div className="flex h-7 items-end gap-1 text-[11px]">
              <span>Date:</span>
              <span className="flex-1 border-b border-black px-1 text-center">
                {formatSignatureDate(new Date())}
              </span>
            </div>
            <p className="agreement-witness-caption mt-0.5 text-left text-[11px] leading-tight">Printed name and signature</p>
            <div />
          </div>
        </div>

        <div className="agreement-print-first-footer flex justify-start pt-0.5">
          <PageFooter />
        </div>

      </div>

    </div>
  );
};

export default AgreementPrintDocument;
