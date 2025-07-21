import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function DropdownFilter({ 
    options = [], 
    selectedOption = "", 
    onChange, 
    placeholder = "",
    labelPrefix = "", // <-- add this prop
    ...props 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (selectedValue) => {
    if (onChange) {
      onChange(selectedValue);
    }
    setIsOpen(false);
  };

  // Find the selected option to display its label
  const selectedOptionObj = options.find(option => option.value === selectedOption);
  const displayValue = selectedOptionObj ? selectedOptionObj.label : placeholder;

  return (
    <div className="relative inline-block font-montserrat " ref={dropdownRef}>
      {/* Dropdown Container */}
      <div
        className="border border-hover-red py-1 px-3 rounded-[15px] cursor-pointer transition-all duration-100 ease-in-out hover:bg-secondary-red group"
        onClick={handleToggle}
      >
        {/* Dropdown Display */}
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-hover-red group-hover:text-white truncate">
            {labelPrefix && (
              <span className="mr-1">{labelPrefix}:</span>
            )}
            {displayValue}
          </span>
          
          {/* Chevron Icon */}
          {isOpen ? (
            <ChevronUp className="w-3 h-3 text-hover-red group-hover:text-white ml-2 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-3 h-3 text-hover-red group-hover:text-white ml-2 flex-shrink-0" />
          )}
        </div>

        {/* Dropdown Options */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-32 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option, index) => (
                <div
                  key={index}
                  className={`text-left px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors duration-150 text-xs font-montserrat ${
                    selectedOption === option.value ? 'bg-gray-50 font-medium' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-xs font-montserrat">
                No options available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}