import { ChevronDown } from "lucide-react";

const Select = ({
  label,
  required,
  error,
  options = [],
  className = "",
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          className={`w-full appearance-none rounded-2xl border bg-white px-3.5 py-2.5 pr-9 text-sm text-black outline-none transition focus:border-slate-400 ${
            error ? "border-red-300" : "border-slate-200"
          } ${className}`}
          {...props}
        >
          <option value="">Select</option>

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
};

export default Select;