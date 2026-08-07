import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

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

const QuickPatientForm = ({ embedded = false }) => {
  const { createPatient, loading } = usePatientStore();
  const { doctors, fetchDoctors } = useDoctorStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      middle_name: "",
      gender: "",
      birthdate: "",
      doctor: "",
      blood_type: "",
    },
  });

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const onSubmit = async (data) => {
    try {
      await createPatient(data);
      toast.success("Patient added successfully");
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add patient");
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className={`h-full p-3 ${embedded ? "" : "rounded-xl border border-slate-200/70 bg-white shadow-sm"}`}>
      <h2 className="text-sm font-bold text-slate-900">Patient Form</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-2 grid grid-cols-2 gap-2">
        <div className="contents">
          <Input label="First Name" {...register("first_name", { required: true })} />
          <Input label="Last Name" {...register("last_name", { required: true })} />
          <Input label="Middle Name" {...register("middle_name")} />
          <Select label="Gender" {...register("gender", { required: true })} options={GENDER_OPTIONS} />
          <DateInput label="Birthdate" {...register("birthdate", { required: true })} />
          <Select
            label="Doctor"
            {...register("doctor")}
            options={doctors.map((doctor) => ({
              value: doctor._id,
              label: formatDoctorName(doctor),
            }))}
          />
        </div>

        <Select label="Blood Type" {...register("blood_type", { required: true })} options={BLOOD_TYPE_OPTIONS} />

        {hasErrors && <p className="self-end text-[9px] text-red-500">Please fill required fields.</p>}

        <button
          type="submit"
          disabled={loading}
          className="h-6 self-end rounded-md bg-emerald-600 px-2 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Add Patient"}
        </button>
      </form>
    </div>
  );
};

export default QuickPatientForm;
