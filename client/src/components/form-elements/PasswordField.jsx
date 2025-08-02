import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Info } from "lucide-react";

export default function PasswordField({
  label = "Password",
  name = "password",
  required = false,
  error: externalError = "",
  onBlur,
  onChange,
  value = "",
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [realValue, setRealValue] = useState("");
  const [maskedValue, setMaskedValue] = useState("");
  const maskTimerRef = useRef(null);
  const inputRef = useRef(null);

  const displayError = externalError || internalError;
  const hasError = Boolean(displayError);
  const hasValue = Boolean(realValue);

  // Initialize real value from prop
  useEffect(() => {
    if (value !== realValue) {
      setRealValue(value);
      setMaskedValue(showPassword ? value : "•".repeat(value.length));
    }
  }, [value]);

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push("at least 8 characters");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("one lowercase letter");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("one number");
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("one special character");
    }
    
    if (errors.length > 0) {
      return `Password must contain ${errors.join(", ")}.`;
    }
    
    return "";
  };

  const handleBlur = (e) => {
    setIsFocused(realValue !== "");

    if (required && !realValue.trim()) {
      setInternalError(`${label} is required.`);
    } else {
      // Validate password strength
      const passwordError = validatePassword(realValue);
      setInternalError(passwordError);
    }

    if (onBlur) {
      // Create event with real value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name,
          value: realValue,
        },
      };
      onBlur(syntheticEvent);
    }
  };

  const handleInputChange = (e) => {
    const typed = e.target.value;
    
    if (showPassword) {
      // When password is visible, update normally
      setRealValue(typed);
      setMaskedValue(typed);
      
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            name,
            value: typed,
          },
        };
        onChange(syntheticEvent);
      }
      return;
    }

    // Password masking behavior when hidden
    if (typed.length < realValue.length) {
      // User deleted a character
      const newRealValue = realValue.substring(0, typed.length);
      setRealValue(newRealValue);
      setMaskedValue("•".repeat(newRealValue.length));
      
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            name,
            value: newRealValue,
          },
        };
        onChange(syntheticEvent);
      }
    } else if (typed.length === realValue.length + 1) {
      // User added one character
      const lastChar = typed[typed.length - 1];
      const newRealValue = realValue + lastChar;
      setRealValue(newRealValue);
      
      // Show all bullets except the last character
      const newMaskedValue = "•".repeat(newRealValue.length - 1) + lastChar;
      setMaskedValue(newMaskedValue);
      
      // Clear and reset the timer to hide last char
      clearTimeout(maskTimerRef.current);
      maskTimerRef.current = setTimeout(() => {
        setMaskedValue("•".repeat(newRealValue.length));
      }, 1000); // show last char for 1 second
      
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            name,
            value: newRealValue,
          },
        };
        onChange(syntheticEvent);
      }
    } else {
      // User pasted or jumped cursor; ignore for security
      e.target.value = maskedValue;
      return;
    }

    // Clear internal error when user starts typing
    if (internalError) {
      setInternalError("");
    }
  };

  const handlePaste = (e) => {
    e.preventDefault(); // Prevent paste for security
  };

  const handleKeyDown = (e) => {
    // Prevent moving cursor for security when password is hidden
    if (!showPassword && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    clearTimeout(maskTimerRef.current);
    
    if (!showPassword) {
      // Switching to visible - show real value
      setMaskedValue(realValue);
    } else {
      // Switching to hidden - show masked value
      setMaskedValue("•".repeat(realValue.length));
    }
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    const requirements = [
      { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
      { id: 'uppercase', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
      { id: 'lowercase', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
      { id: 'number', label: 'One number', test: (p) => /[0-9]/.test(p) },
      { id: 'special', label: 'One special character', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) }
    ];

    return requirements.map(req => ({
      ...req,
      met: req.test(password)
    }));
  };

  const passwordStrength = getPasswordStrength(realValue);
  
  const toggleRequirements = () => {
    setShowRequirements(!showRequirements);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (maskTimerRef.current) {
        clearTimeout(maskTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col w-full items-center font-poppins">
      {/*Password Field Container*/}
      <div
        className={`border py-3 px-6 rounded-[30px] relative w-full transition-all duration-200 ease-in-out ${
          hasError
            ? "border-error-red"
            : isFocused
            ? "border-black"
            : "border-gray-400"
        }`}
      >
        {/*Password Input*/}
        <div className="flex items-center w-full">
          <input
            ref={inputRef}
            type="text"
            name={name}
            className="text-black outline-none bg-transparent w-full font-poppins pr-10"
            value={maskedValue}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            onChange={handleInputChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            {...props}
          />
          
          {/*Eye Toggle Button*/}
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 p-1 text-gray-500 hover:text-gray-700 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        {/*Password Label*/}
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

        {/*Password Requirements Info Button*/}
        {(isFocused || hasValue) && (
          <button
            type="button"
            onClick={toggleRequirements}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
            tabIndex={-1}
            title="Password requirements"
          >
            <Info size={16} />
          </button>
        )}
      </div>

      {/*Password Requirements Popup*/}
      {showRequirements && (
        <div className="w-full mt-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-gray-600 font-poppins font-semibold">Password requirements:</div>
            <button
              type="button"
              onClick={toggleRequirements}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {passwordStrength.map((req) => (
              <div key={req.id} className="flex items-center text-xs font-poppins">
                <span className={`mr-2 ${req.met ? 'text-green-500' : 'text-gray-400'}`}>
                  {req.met ? '✓' : '○'}
                </span>
                <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
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
