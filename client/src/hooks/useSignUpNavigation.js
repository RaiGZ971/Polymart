import { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- Add this import

export const useSignUpNavigation = (
  emailVerificationStep,
  handleSubmit,
  formData,
  fieldConfig,
  phaseConfig
) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [step5SubStep, setStep5SubStep] = useState(1);
  const navigate = useNavigate(); // <-- Add this line

  const validateCurrentStep = () => {
    // Get the phase configuration for current step
    const currentPhase = phaseConfig[currentStep];
    if (!currentPhase || !currentPhase.fields) {
      return true;
    }

    // Password match validation for step 2
    if (currentStep === 2) {
      if (formData.password !== formData.confirmPassword) {
        return false;
      }
    }

    // Check each field in the current phase
    for (const fieldName of currentPhase.fields) {
      const fieldDef = fieldConfig[fieldName];
      if (!fieldDef) continue;

      if (fieldDef.required) {
        const value = formData[fieldName];

        // Special validation for file uploads
        if (fieldDef.type === "file") {
          // More flexible file validation - check for File objects, valid strings, or arrays
          const isValidFile =
            value &&
            (value instanceof File || // Single File object
              (typeof value === "string" &&
                value.length > 0 &&
                value !== "null" &&
                value !== "undefined") || // Valid string (URL, base64, etc.)
              (Array.isArray(value) && value.length > 0) || // Array of files
              (value instanceof FileList && value.length > 0)); // FileList

          if (!isValidFile) {
            return false;
          }
        } else {
          // Regular field validation
          if (!value || (typeof value === "string" && value.trim() === "")) {
            return false;
          }
        }
      }
    }

    return true;
  };

  const canGoForward = () => {
    // Email verification check for step 1
    if (currentStep === 1 && emailVerificationStep !== "verified") {
      return false;
    }

    // Form validation for steps 2-5
    if (currentStep >= 2 && currentStep <= 5) {
      // For step 5 final substep, allow "Finish" action
      if (currentStep === 5 && step5SubStep === 3) {
        return true; // Allow "Finish" button
      }

      const validationResult = validateCurrentStep();
      return validationResult;
    }

    return true;
  };

  const nextStep = () => {
    const canProceed = canGoForward();

    if (!canProceed) {
      return;
    }

    // Check email verification on step 1
    if (currentStep === 1 && emailVerificationStep !== "verified") {
      alert("Please verify your email before proceeding");
      return;
    }

    // Handle step 5 substeps
    if (currentStep === 5) {
      if (step5SubStep === 1) {
        setStep5SubStep(2);
        return;
      } else if (step5SubStep === 2) {
        handleSubmit();
        setStep5SubStep(3);
        return;
      } else if (step5SubStep === 3) {
        navigate("/sign-in"); // <-- Add this line
        return;
      }
    }

    // Move to next step
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 4) {
        setStep5SubStep(1);
      }
    }
  };

  const prevStep = () => {
    // Handle step 5 substeps
    if (currentStep === 5) {
      if (step5SubStep === 3) {
        setStep5SubStep(2);
        return;
      } else if (step5SubStep === 2) {
        setStep5SubStep(1);
        return;
      }
    }

    // Move to previous step
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canGoBack = () => {
    // Allow going back from phase 5
    if (currentStep === 5) {
      return true;
    }

    if (currentStep === 1) {
      return emailVerificationStep !== "enterEmail";
    }

    return currentStep > 1;
  };

  const getNextButtonText = () => {
    if (currentStep === 5 && step5SubStep === 2) {
      return "Submit Application";
    } else if (currentStep === 5 && step5SubStep === 3) {
      return "Finish";
    }
    return "Next";
  };

  return {
    currentStep,
    step5SubStep,
    nextStep,
    prevStep,
    canGoBack,
    canGoForward,
    getNextButtonText,
    setCurrentStep,
    setStep5SubStep,
  };
};
