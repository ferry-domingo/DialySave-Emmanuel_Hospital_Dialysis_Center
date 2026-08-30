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
    <div className="space-y-0.5">
      {label && (
        <label className="ui-field-label text-[9px] font-bold uppercase tracking-wide">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          className={`ui-field h-8 w-full appearance-none rounded-xl border bg-white px-2.5 py-0 pr-7 text-xs text-slate-900 outline-none transition ${
            error ? "border-red-300" : "border-slate-200"
          } ${className}`}
          {...props}
          style={{ ...props.style, fontSize: "12px" }}
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
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
};

export default Select;
