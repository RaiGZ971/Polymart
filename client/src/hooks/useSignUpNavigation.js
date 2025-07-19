import { useState } from 'react';

export const useSignUpNavigation = (emailVerificationStep, handleSubmit) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [step5SubStep, setStep5SubStep] = useState(1);

  const nextStep = () => {
    // Check email verification on step 1
    if (currentStep === 1 && emailVerificationStep !== 'verified') {
      alert('Please verify your email before proceeding');
      return;
    }
    
    // Handle step 5 substeps
    if (currentStep === 5) {
      if (step5SubStep === 1) {
        setStep5SubStep(2);
        return;
      } else if (step5SubStep === 2) {
        // This is the final submission
        handleSubmit();
        return;
      }
    }
    
    // Move to next step
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      // Reset step 5 substep when entering step 5
      if (currentStep === 4) {
        setStep5SubStep(1);
      }
    }
  };

  const prevStep = () => {
    // Handle step 5 substeps
    if (currentStep === 5 && step5SubStep === 2) {
      setStep5SubStep(1);
      return;
    }
    
    // Move to previous step
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canGoBack = () => {
    return !(currentStep === 1 || (currentStep === 5 && step5SubStep === 1));
  };

  const canGoForward = () => {
    return !(currentStep === 1 && emailVerificationStep !== 'verified');
  };

  const getNextButtonText = () => {
    if (currentStep === 5 && step5SubStep === 2) {
      return 'Submit Application';
    }
    return 'Next';
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
    setStep5SubStep
  };
};