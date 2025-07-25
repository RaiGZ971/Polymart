const VARIANTS = {
  primary: "bg-primary-red text-white hover:bg-hover-red font-semibold",
  darkred: "bg-hover-red text-white hover:bg-secondary-red font-semibold",
  outline:
    "border border-primary-red text-primary-red hover:bg-primary-red hover:text-white font-semibold",
  secondary: "bg-gray-200 text-black hover:bg-gray-300",
  danger: "bg-red-600 text-white hover:bg-red-700",
  graytext:
    "text-gray-500 hover:text-primary-red hover:underline shadow-none font-semibold",
  back: "font-regular",
};

export default function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}) {
  const base =
    "px-6 py-2 rounded-full shadow-light transition-colors duration-200";

  return (
    <button
      className={`${base} ${VARIANTS[variant] || ""} ${className} ${
        props.disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      {...props}
    >
      {children}
    </button>
  );
}
