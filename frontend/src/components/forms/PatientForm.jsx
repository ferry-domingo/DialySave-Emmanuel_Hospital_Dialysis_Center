import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Search, UserRound } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import DateInput from "../common/DateInput";

import { usePatientStore } from "../../store/patientStore";
import { useDoctorStore } from "../../store/doctorStore";
import { formatDoctorName } from "../../utils/doctorName";

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const BLOOD_TYPE_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => ({
  value: type,
  label: type,
}));

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Discharged", label: "Discharged" },
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
  doctor: "",
  first_name: "",
  last_name: "",
  middle_name: "",
  birthdate: "",
  gender: "",
  blood_type: "",
  contact_number: "",
  status: "Active",
};

const PatientForm = ({ patient, onClose, onCreated }) => {
  const {
    createPatient,
    updatePatient,
    loading,
  } = usePatientStore();

  const {
    doctors,
    fetchDoctors,
  } = useDoctorStore();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const selectedDoctorId = watch("doctor");
  const selectedDoctor = doctors.find((doctor) => doctor._id === selectedDoctorId) || null;
  const filteredDoctors = doctors.filter((doctor) => {
    const name = `${doctor.first_name} ${doctor.last_name}`.toLowerCase();
    const term = doctorSearch.trim().toLowerCase().replace(/^dra?\.\s*/, "");
    return name.includes(term);
  });

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    if (patient && doctors.length > 0) {
      reset({
        doctor: patient.doctor?._id || "",
        first_name: patient.first_name,
        last_name: patient.last_name,
        middle_name: patient.middle_name,
        birthdate: patient.birthdate?.substring(0, 10),
        gender: patient.gender,
        blood_type: patient.blood_type,
        contact_number: patient.contact_number,
        status: patient.status,
      });
      setDoctorSearch(formatDoctorName(patient.doctor));
    } else {
      reset(DEFAULT_VALUES);
      setDoctorSearch("");
    }
  }, [patient, doctors, reset]);

  const onSubmit = async (data) => {
    try {
      if (patient) {
        await updatePatient(patient._id, data);
        toast.success("Patient updated successfully");
      } else {
        const response = await createPatient(data);
        toast.success("Patient created successfully");
        onCreated?.(response.data?.credentials);
      }

      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">

      <section className="space-y-2 rounded-lg border border-blue-200 bg-white p-2">
        <SectionHeader icon={UserRound} title="Personal Information" />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Input
            label="First Name"
            required
            error={errors.first_name?.message}
            {...register("first_name", { required: "First name is required" })}
          />

          <Input
            label="Last Name"
            required
            error={errors.last_name?.message}
            {...register("last_name", { required: "Last name is required" })}
          />
          <Input label="Middle Name" {...register("middle_name")} />

          <Select
            label="Sex"
            required
            error={errors.gender?.message}
            options={GENDER_OPTIONS}
            {...register("gender", { required: "Sex is required" })}
          />
          <DateInput
            label="Birthdate"
            required
            error={errors.birthdate?.message}
            {...register("birthdate", { required: "Birthdate is required" })}
          />

          <Select
            label="Blood Type"
            required
            error={errors.blood_type?.message}
            options={BLOOD_TYPE_OPTIONS}
            {...register("blood_type", { required: "Blood type is required" })}
          />
          <Input
            label="Contact Number"
            required
            error={errors.contact_number?.message}
            {...register("contact_number", {
              required: "Contact number is required",
              pattern: {
                value: /^09\d{9}$/,
                message: "Invalid contact number",
              },
            })}
          />
          <div className="relative space-y-0.5">
            <label className="text-[9px] font-bold uppercase tracking-wide text-blue-700">Doctor</label>
            <div className="relative">
              <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={doctorSearch}
                onChange={(event) => {
                  setDoctorSearch(event.target.value);
                  setDoctorSearchOpen(true);
                  setValue("doctor", "", { shouldDirty: true });
                }}
                onFocus={() => setDoctorSearchOpen(true)}
                onBlur={() => {
                  setDoctorSearchOpen(false);
                  setDoctorSearch(formatDoctorName(selectedDoctor));
                }}
                placeholder="Search doctor..."
                className="h-6 w-full rounded-md border border-slate-200 py-0 pl-6 pr-2 text-xs text-black outline-none focus:border-slate-400"
                style={{ fontSize: "12px" }}
              />
              <input type="hidden" {...register("doctor")} />
            </div>
            {doctorSearchOpen && (
              <div onMouseDown={(event) => event.preventDefault()} className="absolute z-20 mt-0.5 max-h-24 w-full overflow-y-auto rounded-md bg-white shadow-md">
                {filteredDoctors.length ? filteredDoctors.map((doctor) => (
                  <button
                    key={doctor._id}
                    type="button"
                    onClick={() => {
                      setValue("doctor", doctor._id, { shouldDirty: true });
                      setDoctorSearch(formatDoctorName(doctor));
                      setDoctorSearchOpen(false);
                    }}
                    className="block w-full border-b border-slate-100 px-1.5 py-0.5 text-left text-xs font-medium text-slate-700 last:border-0 hover:bg-blue-50"
                    style={{ fontSize: "12px" }}
                  >
                    {formatDoctorName(doctor)}
                  </button>
                )) : <p className="px-2 py-1.5 text-[10px] text-slate-400">No matching doctor.</p>}
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
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : patient ? "Update" : "Save"}
        </Button>
      </div>
    </form>
  );
};

export default PatientForm;
