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
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (doctor) {
      reset({
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      <div className="space-y-4">
        <SectionHeader icon={Stethoscope} title="Doctor Information" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Doctor ID"
            value={doctor?.doctor_id || "Assigned automatically"}
            disabled
            className="cursor-not-allowed bg-slate-100 font-semibold text-slate-500"
          />

          <Select
            label="Status"
            options={STATUS_OPTIONS}
            {...register("status")}
          />
        </div>
        {!doctor && (
          <p className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">
            The system will generate an ID such as DOC-{new Date().getFullYear()}-0001. The initial password is Surname + birthday in MMDDYYYY format.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Middle Name" autoComplete="additional-name" {...register("middle_name")} />

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
            placeholder="09XXXXXXXXX"
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
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
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
