import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Dropdown({ 
    label = "Label", 
    required = false,
    error: externalError = "",
    onBlur,
    onChange,
    value = "",
    options = [],
    placeholder = "Select an option",
    ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [internalError, setInternalError] = useState("");
  const dropdownRef = useRef(null);
  
  // Use external error if provided, otherwise use internal error
  const displayError = externalError || internalError;
  const hasError = Boolean(displayError);
  const hasValue = Boolean(value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFocused(hasValue);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hasValue]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setIsFocused(true);
  };

  const handleSelect = (selectedValue, selectedLabel) => {
    if (onChange) {
      onChange({
        target: {
          value: selectedValue,
          label: selectedLabel
        }
      });
    }
    
    setIsOpen(false);
    setIsFocused(Boolean(selectedValue));
    
    // Clear error when user makes selection
    if (internalError) {
      setInternalError("");
    }
  };

  const handleBlur = () => {
    if (!isOpen) {
      setIsFocused(hasValue);
      
      // Validate required field
      if (required && !value) {
        setInternalError(`${label} is required.`);
      } else {
        setInternalError("");
      }
      
      if (onBlur) {
        onBlur({ target: { value } });
      }
    }
  };

  // Find the selected option to display its label
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : "";

  return (
    <div className="flex flex-col items-center font-poppins" ref={dropdownRef}>
      {/*Dropdown Container*/}
      <div
        className={`border py-3 px-6 rounded-[30px] relative w-full transition-all duration-200 ease-in-out cursor-pointer ${
          hasError 
            ? "border-error-red" 
            : isFocused || isOpen
              ? "border-black" 
              : "border-gray-400"
        }`}
        onClick={handleToggle}
        onBlur={handleBlur}
      >
        {/*Dropdown Display*/}
        <div className="text-black outline-none bg-transparent w-full font-poppins flex justify-between items-center">
          <span className={hasValue ? "text-black" : "text-transparent"}>
            {displayValue || placeholder}
          </span>
          
          {/* Chevron Icon */}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </div>

        {/*Dropdown Label*/}
        <span
          className={`absolute left-3 bg-white pointer-events-none px-2 transition-all duration-200 font-poppins ${
            isFocused || hasValue || isOpen
              ? `-top-2 text-xs px-2 ${hasError ? "text-error-red font-bold" : "text-black font-bold"}`
              : `top-3 text-base ${hasError ? "text-error-red" : "text-gray-400"}`
          }`}
        >
          {label}{required && <span className="text-error-red ml-1">*</span>}
        </span>

        {/*Dropdown Options*/}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option, index) => (
                <div
                  key={index}
                  className="text-left px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors duration-150 text-black font-poppins"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.value, option.label);
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 font-poppins">
                No options available
              </div>
            )}
          </div>
        )}
      </div>
      
      {/*Error Message*/}
      {hasError && (
        <span className="text-error-red text-xs mt-2 px-2 max-w-full text-left italic w-full pl-6 font-poppins">
          {displayError}
        </span>
      )}
    </div>
  );
}