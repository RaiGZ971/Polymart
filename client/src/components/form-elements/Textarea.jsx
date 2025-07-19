import { useState } from "react";

export default function Textarea({ 
    label="Label", 
    required=false,
    error: externalError = "",
    onBlur,
    onChange,
    value = "",
    rows = 4,
    maxLength,
    ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState("");
  
  const displayError = externalError || internalError;
  const hasError = Boolean(displayError);
  const hasValue = Boolean(value);
  const characterCount = value.length;

  const handleBlur = (e) => {
    const inputValue = e.target.value;
    setIsFocused(inputValue !== "");
    
    if (required && !inputValue.trim()) {
      setInternalError(`${label} is required.`);
    }
    else if (maxLength && inputValue.length > maxLength) {
      setInternalError(`${label} must be ${maxLength} characters or less.`);
    } 
    else {
      setInternalError("");
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleChange = (e) => {
    let inputValue = e.target.value;
    
    if (maxLength && inputValue.length > maxLength) {
      inputValue = inputValue.slice(0, maxLength);
      e = {
        ...e,
        target: {
          ...e.target,
          value: inputValue
        }
      };
    }
    
    if (internalError) {
      setInternalError("");
    }
    
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="flex flex-col w-full items-center font-poppins flex-1">
      {/*Textarea Container*/}
      <div
        className={`border py-3 px-6 rounded-[20px] relative w-full flex-1 flex transition-all duration-200 ease-in-out ${
          hasError 
            ? "border-error-red" 
            : isFocused 
              ? "border-black" 
              : "border-gray-400"
        }`}
      >

        {/*Textarea Input*/}
        <textarea
          className="text-black outline-none bg-transparent w-full font-poppins resize-none flex-1"
          value={value}
          rows={rows}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onChange={handleChange}
          style={{ minHeight: `${rows * 1.5}rem` }}
          {...props}
        />

        {/*Textarea Label*/}
        <span
          className={`absolute left-3 bg-white pointer-events-none px-2 transition-all duration-200 font-poppins ${
            isFocused || hasValue
              ? `-top-2 text-xs px-2 ${hasError ? "text-error-red font-bold" : "text-black font-bold"}`
              : `top-3 text-base ${hasError ? "text-error-red" : "text-gray-400"}`
          }`}
        >
          {label}{required && <span className="text-error-red ml-1">*</span>}
        </span>
      </div>
      
      {/*Character Counter*/}
      {maxLength && (
        <div className="w-full flex justify-start mt-1 px-2">
          <span className={`text-xs font-poppins ${
            characterCount > maxLength ? 'text-error-red' : 'text-gray-400'
          }`}>
            {characterCount}/{maxLength} characters
          </span>
        </div>
      )}
      
      {/*Error Message*/}
      {hasError && (
        <span className="text-error-red text-xs mt-2 px-2 max-w-full text-left italic w-full pl-4 font-poppins">
          {displayError}
        </span>
      )}
    </div>
  );
}