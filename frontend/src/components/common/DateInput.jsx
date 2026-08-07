const DateInput = ({
  label,
  required,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className="space-y-0.5">
      {label && (
        <label className="text-[9px] font-bold uppercase tracking-wide text-blue-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <input
        type="date"
        className={`h-6 w-full rounded-md border px-2 py-0 text-xs text-black outline-none transition focus:border-slate-400 ${
          error ? "border-red-300" : "border-slate-200"
        } ${className}`}
        {...props}
        style={{ ...props.style, fontSize: "12px" }}
      />

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
};

export default DateInput;
