const Input = ({
  label,
  required,
  error,
  className = "",
  containerClassName = "",
  ...props
}) => {
  return (
    <div className={`space-y-0.5 ${containerClassName}`}>
      {label && (
        <label className="text-[9px] font-bold uppercase tracking-wide text-blue-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <input
        className={`h-6 w-full rounded-md border px-2 py-0 text-xs text-black outline-none transition focus:border-slate-400 ${
          error ? "border-red-300" : "border-slate-200"
        } ${className}`}
        {...props}
        style={props.style}
      />

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
