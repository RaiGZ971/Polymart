export default function SmallButton({ 
    label = "Click Me", 
    onClick, 
    className = "", 
    ...props 
}) {
  return (
    <div className="relative inline-block font-montserrat">
      <div
        className="border border-hover-red py-1 px-3 rounded-[15px] cursor-pointer transition-all duration-100 ease-in-out hover:bg-secondary-red group"
        onClick={onClick}
        {...props}
      >
        <div className="flex justify-center items-center text-xs font-bold">
          <span className="text-hover-red group-hover:text-white truncate">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}