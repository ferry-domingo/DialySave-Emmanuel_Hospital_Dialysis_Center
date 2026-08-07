import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Search, Stethoscope } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import DateInput from "../common/DateInput";

import { useDoctorStore } from "../../store/doctorStore";

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const MEDICAL_EXPERTISE_OPTIONS = [
  "Nephrologist",
  "Internal Medicine Physician (Internist)",
  "Cardiologist",
  "Vascular Surgeon",
  "Urologist",
];

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-1.5 rounded-md bg-blue-100 px-2 py-1 text-blue-950">
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/80 text-slate-500">
      <Icon size={12} />
    </span>
    <h3 className="text-xs font-bold text-slate-900">{title}</h3>
  </div>
);

const DEFAULT_VALUES = {
  first_name: "",
  last_name: "",
  middle_name: "",
  birthdate: "",
  gender: "",
  contact_number: "",
  medical_expertise: "",
  status: "Active",
};

const DoctorForm = ({ doctor, onClose }) => {
  const {
    createDoctor,
    updateDoctor,
    loading,
  } = useDoctorStore();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });
  const [expertiseSearch, setExpertiseSearch] = useState("");
  const [expertiseOpen, setExpertiseOpen] = useState(false);
  const filteredExpertise = MEDICAL_EXPERTISE_OPTIONS.filter((expertise) =>
    expertise.toLowerCase().includes(expertiseSearch.trim().toLowerCase())
  );

  useEffect(() => {
    if (doctor) {
      reset({
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        middle_name: doctor.middle_name,
        birthdate: doctor.birthdate?.substring(0, 10),
        gender: doctor.gender,
        contact_number: doctor.contact_number,
        medical_expertise: doctor.medical_expertise || "",
        status: doctor.status,
      });
      setExpertiseSearch(doctor.medical_expertise || "");
    } else {
      reset(DEFAULT_VALUES);
      setExpertiseSearch("");
    }
  }, [doctor, reset]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      middle_name: data.middle_name?.trim() || "",
      contact_number: data.contact_number.trim(),
    };

    try {
      if (doctor) {
        await updateDoctor(doctor._id, payload);
        toast.success("Doctor updated successfully");
      } else {
        const response = await createDoctor(payload);
        const credentials = response.data?.credentials;
        toast.success(
          credentials
            ? `Doctor created. Login ID: ${credentials.loginId} | Initial password: ${credentials.initialPassword}`
            : "Doctor created successfully",
          { duration: 10000 }
        );
      }

      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">

      <section className="space-y-2 rounded-lg border border-blue-200 bg-white p-2">
        <SectionHeader icon={Stethoscope} title="Doctor Information" />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Input
            label="First Name"
            required
            error={errors.first_name?.message}
            autoComplete="given-name"
            {...register("first_name", {
              required: "First name is required",
              validate: (value) => value.trim().length >= 2 || "Enter at least 2 characters",
            })}
          />

          <Input
            label="Last Name"
            required
            error={errors.last_name?.message}
            autoComplete="family-name"
            {...register("last_name", {
              required: "Last name is required",
              validate: (value) => value.trim().length >= 2 || "Enter at least 2 characters",
            })}
          />
          <Input label="Middle Name" autoComplete="additional-name" {...register("middle_name")} />

          <Select
            label="Gender"
            required
            error={errors.gender?.message}
            options={GENDER_OPTIONS}
            {...register("gender", { required: "Gender is required" })}
          />
          <DateInput
            label="Birthdate"
            required
            max={new Date().toISOString().slice(0, 10)}
            error={errors.birthdate?.message}
            {...register("birthdate", {
              required: "Birthdate is required",
              validate: (value) => new Date(`${value}T00:00:00`) <= new Date() || "Birthdate cannot be in the future",
            })}
          />

          <Input
            label="Contact Number"
            required
            error={errors.contact_number?.message}
            inputMode="numeric"
            autoComplete="tel"
            maxLength={11}
            {...register("contact_number", {
              required: "Contact number is required",
              pattern: {
                value: /^09\d{9}$/,
                message: "Invalid contact number",
              },
            })}
          />
          <div className="relative space-y-0.5">
            <label className="text-[9px] font-bold uppercase tracking-wide text-blue-700">Medical Expertise</label>
            <div className="relative">
              <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={expertiseSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  setExpertiseSearch(value);
                  setValue("medical_expertise", value, { shouldDirty: true });
                  setExpertiseOpen(true);
                }}
                onFocus={() => setExpertiseOpen(true)}
                onBlur={() => setExpertiseOpen(false)}
                placeholder="Select or enter expertise"
                className="h-6 w-full rounded-md border border-slate-200 py-0 pl-6 pr-2 text-xs text-black outline-none focus:border-slate-400"
                style={{ fontSize: "12px" }}
              />
              <input type="hidden" {...register("medical_expertise")} />
            </div>
            {expertiseOpen && (
              <div onMouseDown={(event) => event.preventDefault()} className="absolute z-20 mt-0.5 max-h-28 w-full overflow-y-auto rounded-md bg-white shadow-md">
                {filteredExpertise.length ? filteredExpertise.map((expertise) => (
                  <button
                    key={expertise}
                    type="button"
                    onClick={() => {
                      setExpertiseSearch(expertise);
                      setValue("medical_expertise", expertise, { shouldDirty: true });
                      setExpertiseOpen(false);
                    }}
                    className="block w-full border-b border-slate-100 px-1.5 py-0.5 text-left text-xs font-medium text-slate-700 last:border-0 hover:bg-blue-50"
                    style={{ fontSize: "12px" }}
                  >
                    {expertise}
                  </button>
                )) : (
                  <p className="px-2 py-1.5 text-[10px] text-slate-400">Press Save to use this custom expertise.</p>
                )}
              </div>
            )}
          </div>
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            {...register("status")}
          />
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting || loading}>
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting || loading}>
          {isSubmitting || loading ? "Saving..." : doctor ? "Update Doctor" : "Create Doctor"}
        </Button>
      </div>
    </form>
  );
};

export default DoctorForm;
