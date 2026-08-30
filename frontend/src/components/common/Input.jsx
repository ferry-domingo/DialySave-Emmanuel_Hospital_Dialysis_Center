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
        <label className="ui-field-label text-[9px] font-bold uppercase tracking-wide">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <input
        className={`ui-field h-8 w-full rounded-xl border px-2.5 py-0 text-xs text-slate-900 outline-none transition ${
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
