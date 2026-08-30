const VARIANTS = {
  primary: "ui-button-primary text-white",
  secondary: "ui-button-secondary text-slate-700",
  danger: "ui-button-danger text-white",
};

const Button = ({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) => {
  return (
    <button
      type={type}
      className={`ui-button min-h-8 rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
