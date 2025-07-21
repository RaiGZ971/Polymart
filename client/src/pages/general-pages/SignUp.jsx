import { useState } from "react";

import {
  NavigationBar,
  PhaseContainer,
  Footer,
  PhaseIndicator,
  NavigationButtons,
  Phase2Layout,
  Phase3Layout,
  Phase4Layout,
  Phase5Layout
} from "../../components";

import { 
  fieldConfig,
  phaseConfig,
} from "../../data";

import { useSignUpNavigation } from "../../hooks/useSignUpNavigation";
import { useEmailVerification } from "../../hooks/useEmailVerification";
import { useEmailVerificationRenderer } from "../../hooks/useEmailVerificationRenderer";
import { useFieldRenderer } from "../../hooks/useFieldRenderer";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useFormData } from "../../hooks/useFormData";

export default function SignUp() {
  // Define steps array
  const steps = [
    'Email Verification',
    'Personal Details', 
    'Student Details',
    'Account Setup',
    'Student Verification',
  ];

  // Use the form data management hook
  const {
    formData,
    setFormData,
    handleChange,
    handleDropdownChange,
    updateField,
    updateFields,
    resetFormData,
    resetFields
  } = useFormData();

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
  };

  // Use the email verification hook
  const {
    emailVerificationStep,
    handleSendVerification,
    handleResendVerification,
    handleChangeEmail,
    handleTestVerification,
    getEmailVerificationTitle
  } = useEmailVerification();

  // Use the navigation hook
  const {
    currentStep,
    step5SubStep,
    nextStep,
    prevStep,
    canGoBack,
    canGoForward,
    getNextButtonText
  } = useSignUpNavigation(emailVerificationStep, handleSubmit, formData, fieldConfig, phaseConfig);

  // Use the file upload hook
  const { handleFileChange, removeFile, getFilePreviewURL } = useFileUpload(formData, setFormData);

  // Use the field renderer hook
  const { renderField } = useFieldRenderer(formData, fieldConfig, {
    handleChange,
    handleDropdownChange,
    handleFileChange
  });

  // <--------- Email Verification Handlers ---------->
  const handleSendVerificationWithEmail = () => {
    handleSendVerification(formData.email);
  };

  const handleResendVerificationWithEmail = () => {
    handleResendVerification(formData.email);
  };

  const handleChangeEmailWithReset = () => {
    handleChangeEmail(setFormData);
  };

  // Use the email verification renderer hook
  const { renderEmailVerificationContent } = useEmailVerificationRenderer(
    emailVerificationStep,
    formData,
    {
      handleChange,
      handleSendVerificationWithEmail,
      handleResendVerificationWithEmail,
      handleChangeEmailWithReset,
      handleTestVerification
    }
  );

  // Simplified phase rendering using configuration
  const renderPhaseContent = () => {
    const phase = phaseConfig[currentStep];
    if (!phase) return null;

    // Special handling for email verification phase
    if (currentStep === 1) {
      return (
        <PhaseContainer 
          label={phase.label}
          title={getEmailVerificationTitle()}
        >
          {renderEmailVerificationContent()}
        </PhaseContainer>
      );
    }

  let phaseTitle = phase.title;
    if (currentStep === 5 && step5SubStep === 3) {
      phaseTitle = "You're in!"; // Or whatever title you want
    }

    return (
      <PhaseContainer label={phase.label} title={phaseTitle}>
        <div className="flex flex-col space-y-6">
          {/* Phase 2 - Personal Details */}
          {currentStep === 2 && (
            <Phase2Layout renderField={renderField} />
          )}

          {/* Phase 3 - Student Details */}
          {currentStep === 3 && (
            <Phase3Layout renderField={renderField} />
          )}

          {/* Phase 4 - Account Setup */}
          {currentStep === 4 && (
            <Phase4Layout
              formData={formData}
              handleFileChange={handleFileChange}
              removeFile={removeFile}
              renderField={renderField}
            />
          )}

          {/* Phase 5 - Document Upload */}
          {currentStep === 5 && (
            <Phase5Layout
              step5SubStep={step5SubStep}
              formData={formData}
              handleFileChange={handleFileChange}
              removeFile={removeFile}
            />
          )}
        </div>
        
      </PhaseContainer>
    );
  };

  // Main Content
  return (
    <>
      <div className='w-full h-screen bg-white flex flex-col items-center'>
        <div className="w-full p-10 px-0 mx-0">
          <NavigationBar variant="signup"/>
        </div>

        <div className="w-[60%] flex flex-row justify-between mt-8">
          <h1 className="text-5xl font-bold text-primary-red">Sign Up</h1>
          <PhaseIndicator currentStep={currentStep} steps={steps} />
        </div>
      
        <div className="w-[60%] h-full flex flex-col mt-10">
          {renderPhaseContent()}
        </div>
          
        <NavigationButtons
          onPrevStep={prevStep}
          onNextStep={nextStep}
          canGoBack={canGoBack()}
          canGoForward={canGoForward()}
          nextButtonText={getNextButtonText()}
        />
        
        <Footer variant="dark" className="w-full" />
      </div>
    </>
  );
}