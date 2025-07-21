export default function SmallButton({ 
    label = "Click Me", 
    onClick, 
    className = "",
    bgColor = "hover:bg-secondary-red",
    textColor = "text-hover-red",
    borderColor = "border-hover-red",
    hoverTextColor = "group-hover:text-white",
    ...props 
}) {
  return (
    <div className="relative inline-block font-montserrat">
      <div
        className={`border ${borderColor} py-1 px-3 rounded-[15px] cursor-pointer transition-all duration-100 ease-in-out ${bgColor} group ${className}`}
        onClick={onClick}
        {...props}
      >
        <div className="flex justify-center items-center text-xs font-bold">
          <span className={`${textColor} ${hoverTextColor} truncate`}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}