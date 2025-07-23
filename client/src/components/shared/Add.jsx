import { Plus } from "lucide-react";

export default function Add({
  onClick,
  text = "Click to add files",
  className = "",
  disabled = false,
  ...props
}) {
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <div
      className={`w-full border-2 border-dashed rounded-lg p-6 flex-1 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group ${
        disabled
          ? "border-gray-300 bg-gray-50 cursor-not-allowed"
          : "border-gray-400 hover:bg-gray-100 hover:border-gray-500"
      } ${className}`}
      onClick={handleClick}
      {...props}
    >
      <Plus
        className={`w-8 h-8 mb-2 transition-colors duration-200 ${
          disabled
            ? "text-gray-300"
            : "text-gray-500 group-hover:text-primary-red"
        }`}
      />
      <div
        className={`text-center transition-colors duration-200 ${
          disabled
            ? "text-gray-300"
            : "text-gray-500 group-hover:text-primary-red"
        }`}
      >
        <span className="text-sm">{text}</span>
      </div>
    </div>
  );
}
