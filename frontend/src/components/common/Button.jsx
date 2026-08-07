const VARIANTS = {
  primary: "bg-slate-950 text-white hover:bg-slate-800",
  secondary: "border border-slate-200 text-slate-600 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
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
      className={`rounded-md px-2.5 py-0.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
