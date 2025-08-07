import { useState } from "react";

export default function Textfield({
  label = "Label",
  required = false,
  error: externalError = "",
  onBlur,
  onChange,
  value = "",
  integerOnly = false,
  validation = null,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState("");

  const displayError = externalError || internalError;
  const hasError = Boolean(displayError);
  const hasValue = Boolean(value);

  const handleBlur = (e) => {
    const inputValue = e.target.value;
    setIsFocused(inputValue !== "");

    if (required && !inputValue.trim()) {
      setInternalError(`${label} is required.`);
    } else if (
      integerOnly &&
      inputValue &&
      !Number.isInteger(Number(inputValue))
    ) {
      setInternalError(`${label} must be a whole number.`);
    } else if (
      validation &&
      validation.pattern &&
      inputValue &&
      !validation.pattern.test(inputValue)
    ) {
      setInternalError(validation.message || `${label} format is invalid.`);
    } else {
      setInternalError("");
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  const handleChange = (e) => {
    let inputValue = e.target.value;

    // If integer only, filter out non-numeric characters and decimals
    if (integerOnly) {
      inputValue = inputValue.replace(/[^-0-9]/g, "");

      if (inputValue.indexOf("-") > 0) {
        inputValue = inputValue.replace(/-/g, "");
      }

      // Create a new event object with filtered value
      e = {
        ...e,
        target: {
          ...e.target,
          value: inputValue,
        },
      };
    }

    if (internalError) {
      setInternalError("");
    }

    if (onChange) {
      onChange(e);
    }
  };

  const handleKeyPress = (e) => {
    if (integerOnly) {
      const char = String.fromCharCode(e.which);
      const currentValue = e.target.value;

      if (char === "-" && currentValue.length === 0) {
        return;
      }

      if (!/[0-9]/.test(char)) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="flex flex-col w-full items-center font-poppins">
      {/*Textfield Container*/}
      <div
        className={`border py-3 px-6 rounded-[30px] relative w-full transition-all duration-200 ease-in-out ${
          hasError
            ? "border-error-red"
            : isFocused
            ? "border-black"
            : "border-gray-400"
        }`}
      >
        {/*Textfield Input*/}
        <input
          type={integerOnly ? "text" : "text"}
          className="text-black outline-none bg-transparent w-full font-poppins"
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          {...props}
        />

        {/*Textfield Label*/}
        <span
          className={`absolute left-3 bg-white pointer-events-none px-2 transition-all duration-200 font-poppins ${
            isFocused || hasValue
              ? `-top-2 text-xs px-2 ${
                  hasError ? "text-error-red font-bold" : "text-black font-bold"
                }`
              : `top-3 text-base ${
                  hasError ? "text-error-red" : "text-gray-400"
                }`
          }`}
        >
          {label}
          {required && <span className="text-error-red ml-1">*</span>}
        </span>
      </div>

      {/*Error Message*/}
      {hasError && (
        <span className="text-error-red text-xs mt-2 px-2 max-w-full text-left italic w-full pl-4 font-poppins">
          {displayError}
        </span>
      )}
    </div>
  );
}
