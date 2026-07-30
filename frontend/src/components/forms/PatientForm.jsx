import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Stethoscope, UserRound } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import DateInput from "../common/DateInput";

import { usePatientStore } from "../../store/patientStore";
import { useDoctorStore } from "../../store/doctorStore";

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
  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
      <Icon size={14} />
    </span>
    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
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

const PatientForm = ({ patient, onClose }) => {
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
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
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
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [patient, doctors, reset]);

  const onSubmit = async (data) => {
    try {
      if (patient) {
        await updatePatient(patient._id, data);
        toast.success("Patient updated successfully");
      } else {
        await createPatient(data);
        toast.success("Patient created successfully");
      }

      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      <div className="space-y-4">
        <SectionHeader icon={UserRound} title="Personal Information" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Middle Name" {...register("middle_name")} />

          <Select
            label="Gender"
            required
            error={errors.gender?.message}
            options={GENDER_OPTIONS}
            {...register("gender", { required: "Gender is required" })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeader icon={Stethoscope} title="Care & Contact" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Doctor"
            options={doctors.map((doctor) => ({
              value: doctor._id,
              label: `${doctor.first_name} ${doctor.last_name}`,
            }))}
            {...register("doctor")}
          />

          <Select
            label="Status"
            options={STATUS_OPTIONS}
            {...register("status")}
          />
        </div>

        <Input
          label="Contact Number"
          required
          error={errors.contact_number?.message}
          placeholder="09XXXXXXXXX"
          {...register("contact_number", {
            required: "Contact number is required",
            pattern: {
              value: /^09\d{9}$/,
              message: "Invalid contact number",
            },
          })}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
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