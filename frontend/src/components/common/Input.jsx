const Input = ({
  label,
  required,
  error,
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

      <input
        className={`w-full rounded-2xl border px-3.5 py-2.5 text-sm text-black outline-none transition focus:border-slate-400 ${
          error ? "border-red-300" : "border-slate-200"
        } ${className}`}
        {...props}
      />

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
};

export default Input;