const TextArea = ({
  label,
  ...props
}) => {
  return (
    <div className="space-y-1">
      <label className="font-medium">
        {label}
      </label>

      <textarea
        rows={4}
        className="w-full border rounded-lg p-2"
        {...props}
      />
    </div>
  );
};

export default TextArea;