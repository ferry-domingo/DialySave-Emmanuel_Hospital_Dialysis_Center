const TextArea = ({
  label,
  ...props
}) => {
  return (
    <div className="space-y-1.5">
      <label className="ui-field-label text-[9px] font-bold uppercase tracking-wide">
        {label}
      </label>

      <textarea
        rows={4}
        className="ui-field min-h-24 w-full rounded-xl border p-3 text-sm outline-none"
        {...props}
      />
    </div>
  );
};

export default TextArea;
