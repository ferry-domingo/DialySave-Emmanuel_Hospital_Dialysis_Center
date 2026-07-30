import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Stethoscope } from "lucide-react";
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

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
      <Icon size={14} />
    </span>
    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
  </div>
);

const DEFAULT_VALUES = {
  doctor_id: "",
  first_name: "",
  last_name: "",
  middle_name: "",
  birthdate: "",
  gender: "",
  contact_number: "",
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
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (doctor) {
      reset({
        doctor_id: doctor.doctor_id,
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        middle_name: doctor.middle_name,
        birthdate: doctor.birthdate?.substring(0, 10),
        gender: doctor.gender,
        contact_number: doctor.contact_number,
        status: doctor.status,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [doctor, reset]);

  const onSubmit = async (data) => {
    try {
      if (doctor) {
        await updateDoctor(doctor._id, data);
        toast.success("Doctor updated successfully");
      } else {
        await createDoctor(data);
        toast.success("Doctor created successfully");
      }

      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      <div className="space-y-4">
        <SectionHeader icon={Stethoscope} title="Doctor Information" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Doctor ID"
            required
            error={errors.doctor_id?.message}
            {...register("doctor_id", { required: "Doctor ID is required" })}
          />

          <Select
            label="Status"
            options={STATUS_OPTIONS}
            {...register("status")}
          />
        </div>

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
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : doctor ? "Update" : "Save"}
        </Button>
      </div>
    </form>
  );
};

export default DoctorForm;