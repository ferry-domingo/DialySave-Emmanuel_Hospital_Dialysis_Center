import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlaskConical, Search, Stethoscope, Syringe, TestTube, Users, Waves, X } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../common/Button";
import Select from "../common/Select";

import { usePatientStore } from "../../store/patientStore";
import { useDialysisSessionStore } from "../../store/dialysisSessionStore";

const INJECTIONS = [
  "2000 IU / 0.5 mL pre-filled syringe",
  "4000 IU / 0.4 mL pre-filled syringe",
  "4000 IU / mL, 1mL vial",
  "4000 IU / mL solution for injection in 1mL pre-filled syringe",
  "10000 IU / mL pre-filled syringe",

  "2000 IU / 0.3 mL pre-filled syringe",
  "5000 IU / 0.3 mL pre-filled syringe",
  "10000 IU / 0.6 mL pre-filled syringe",
];

const DIALYZERS = ["Low Flux", "High Flux"];

const IV_IRONS = ["Iron Sucrose 20 mg/mL, 5mL ampule"];

const PAYMENT_OPTIONS = [
  { value: "PHIC", label: "PHIC" },
  { value: "PCSO", label: "PCSO" },
  { value: "CASH", label: "CASH" },
];

const SESSION_PAYMENT_OPTIONS = [
  ...PAYMENT_OPTIONS,
  { value: "MISC / V.A.S", label: "MISC / V.A.S" },
];

const LAB_TESTS = [
  "CBC",
  "CREA",
  "BUN",
  "HEPA PROFILE",
  "ALKALINE",
  "POTASSIUM",
  "PHOSPHORUS",
  "CALCIUM",
  "SODIUM",
  "ALBUMIN",
  "Serum Iron",
];

const DEFAULT_LAB_RESULTS = LAB_TESTS.map((name) => ({ name, done: false }));

const DEFAULT_VALUES = {
  patient_id: "",
  doctor_id: "",
  payment_type: "PHIC",
  injections: { name: "", payment_type: "PHIC" },
  dialyzer: { name: "", payment_type: "PHIC" },
  intravenous_iron: { name: "", payment_type: "PHIC" },
  laboratory_results: DEFAULT_LAB_RESULTS,
};

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
      <Icon size={14} />
    </span>
    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
  </div>
);

const DialysisSessionForm = ({
  session,
  onClose,
}) => {

  const {
    patients,
    fetchPatients,
  } = usePatientStore();

  const {
    createSession,
    updateSession,
    loading,
  } = useDialysisSessionStore();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const [patientSearch, setPatientSearch] = useState("");
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  const patientId = watch("patient_id");
  const selectedPatient = patients.find((p) => p._id === patientId) || null;

  const filteredPatients = patients.filter((p) => {
    const term = patientSearch.trim().toLowerCase();
    if (!term) return true;
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(term) || p.patient_id?.toLowerCase().includes(term);
  });

  const handlePickPatient = (patient) => {
    setValue("patient_id", patient._id, { shouldDirty: true });
    setValue("doctor_id", patient.doctor?._id || "", { shouldDirty: true });
    setPatientSearch(`${patient.first_name} ${patient.last_name}`);
    setPatientSearchOpen(false);
  };

  const handleClearPatient = () => {
    setValue("patient_id", "", { shouldDirty: true });
    setValue("doctor_id", "", { shouldDirty: true });
    setPatientSearch("");
    setPatientSearchOpen(false);
  };

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (session && patients.length > 0) {
      reset({
        patient_id: session.patient?._id || "",
        doctor_id: session.doctor?._id || "",
        payment_type: session.payment_type,
        injections: session.injections,
        dialyzer: session.dialyzer,
        intravenous_iron: session.intravenous_iron,
        laboratory_results: session.laboratory_results?.length
          ? session.laboratory_results
          : DEFAULT_LAB_RESULTS,
      });
      setPatientSearch(session.patient ? `${session.patient.first_name} ${session.patient.last_name}` : "");
    } else {
      reset(DEFAULT_VALUES);
      setPatientSearch("");
    }
  }, [session, patients, reset]);

  const onSubmit = async (data) => {
    try {
      if (session) {
        await updateSession(session._id, data);
        toast.success("Updated");
      } else {
        await createSession(data);
        toast.success("Created");
      }

      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong.");
    }
  };

  return (

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      <div className="space-y-4">
        <SectionHeader icon={Users} title="Session Details" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative space-y-1">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">Patient</label>

            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setPatientSearchOpen(true);
                }}
                onFocus={() => setPatientSearchOpen(true)}
                onBlur={() => {
                  setPatientSearchOpen(false);
                  setPatientSearch(selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "");
                }}
                placeholder="Search patient name or ID..."
                className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-9 text-sm text-black outline-none transition focus:border-slate-400"
              />
              {selectedPatient && !patientSearchOpen && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleClearPatient}
                  aria-label="Clear selected patient"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {patientSearchOpen && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl bg-white shadow-lg"
              >
                {filteredPatients.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-400">No matching patient.</p>
                ) : (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient._id}
                      type="button"
                      onClick={() => handlePickPatient(patient)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50"
                    >
                      <span className="font-semibold text-slate-900">{patient.first_name} {patient.last_name}</span>
                      <span className="text-xs text-slate-400">{patient.patient_id}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">Doctor</label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm">
              <Stethoscope size={15} className="shrink-0 text-slate-400" />
              <span className={selectedPatient?.doctor ? "font-semibold text-black" : "text-slate-400"}>
                {selectedPatient?.doctor
                  ? `${selectedPatient.doctor.first_name} ${selectedPatient.doctor.last_name}`
                  : "Select a patient first"}
              </span>
            </div>
          </div>
        </div>

        <Select
          label="Payment Type"
          options={SESSION_PAYMENT_OPTIONS}
          {...register("payment_type")}
        />
      </div>

      <div className="space-y-4">
        <SectionHeader icon={Syringe} title="Injection" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Injection"
            options={INJECTIONS.map((item) => ({ value: item, label: item }))}
            {...register("injections.name")}
          />

          <Select
            label="Injection Payment"
            options={PAYMENT_OPTIONS}
            {...register("injections.payment_type")}
          />
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeader icon={Waves} title="Dialyzer" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Dialyzer"
            options={DIALYZERS.map((item) => ({ value: item, label: item }))}
            {...register("dialyzer.name")}
          />

          <Select
            label="Dialyzer Payment"
            options={PAYMENT_OPTIONS}
            {...register("dialyzer.payment_type")}
          />
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeader icon={FlaskConical} title="Intravenous Iron" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Intravenous Iron"
            options={IV_IRONS.map((item) => ({ value: item, label: item }))}
            {...register("intravenous_iron.name")}
          />

          <Select
            label="IV Iron Payment"
            options={PAYMENT_OPTIONS}
            {...register("intravenous_iron.payment_type")}
          />
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeader icon={TestTube} title="Laboratory Results" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LAB_TESTS.map((lab, index) => (
            <Controller
              key={lab}
              control={control}
              name={`laboratory_results.${index}.done`}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 accent-slate-950"
                  />
                  <span className="text-sm font-medium text-slate-700">{lab}</span>
                </label>
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : session ? "Update" : "Save"}
        </Button>
      </div>

    </form>
  );
};

export default DialysisSessionForm;
