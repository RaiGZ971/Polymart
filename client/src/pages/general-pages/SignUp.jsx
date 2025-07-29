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
  Phase5Layout,
} from "@/components";

import { fieldConfig, phaseConfig } from "../../data";

import { useSignUpNavigation } from "../../hooks/useSignUpNavigation";
import { useEmailVerification } from "../../hooks/useEmailVerification";
import { useEmailVerificationRenderer } from "../../hooks/useEmailVerificationRenderer";
import { useFieldRenderer } from "../../hooks/useFieldRenderer";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useFormData } from "../../hooks/useFormData";

export default function SignUp() {
  // Define steps array
  const steps = [
    "Email Verification",
    "Personal Details",
    "Student Details",
    "Account Setup",
    "Student Verification",
  ];

  const {
    formData,
    setFormData,
    handleChange,
    handleDropdownChange,
    updateField,
    updateFields,
    resetFormData,
    resetFields,
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
    getEmailVerificationTitle,
  } = useEmailVerification();

  // Use the navigation hook
  const {
    currentStep,
    step5SubStep,
    nextStep,
    prevStep,
    canGoBack,
    canGoForward,
    getNextButtonText,
  } = useSignUpNavigation(
    emailVerificationStep,
    handleSubmit,
    formData,
    fieldConfig,
    phaseConfig
  );

  // Use the file upload hook
  const { handleFileChange, removeFile, getFilePreviewURL } = useFileUpload(
    formData,
    setFormData
  );

  // Passwords state
  const [errors, setErrors] = useState({});

  const validatePasswords = () => {
    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Password must be the same as Confirm Password",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handlePasswordChange = (field) => (e) => {
    const value = e.target.value;
    // Update formData first
    handleChange(field)(e);

    // Get the latest password and confirmPassword values
    const password = field === "password" ? value : formData.password || "";
    const confirmPassword =
      field === "confirmPassword" ? value : formData.confirmPassword || "";

    // Validate using the latest values
    if (password && confirmPassword && password !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Password must be the same as Confirm Password",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  // Use the field renderer hook
  const { renderField } = useFieldRenderer(formData, fieldConfig, {
    handleChange: (field) =>
      field === "password" || field === "confirmPassword"
        ? handlePasswordChange(field)
        : handleChange(field),
    handleDropdownChange,
    handleFileChange,
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
      handleTestVerification,
    }
  );

  // Simplified phase rendering using configuration
  const renderPhaseContent = () => {
    switch (currentStep) {
      case 1:
        return renderEmailVerificationContent();
      case 2:
        return (
          <Phase2Layout
            formData={formData || {}}
            errors={errors}
            handleChange={handleChange}
            renderField={renderField}
          />
        );

      case 3:
        return <Phase3Layout renderField={renderField} />;

      case 4:
        return (
          <Phase4Layout
            formData={formData}
            handleFileChange={handleFileChange}
            removeFile={removeFile}
            renderField={renderField}
          />
        );

      case 5:
        return (
          <Phase5Layout
            step5SubStep={step5SubStep}
            formData={formData}
            handleFileChange={handleFileChange}
            removeFile={removeFile}
          />
        );

      default:
        return null;
    }
  };

  // Main Content
  return (
    <>
      <div className="w-full h-screen bg-white flex flex-col items-center">
        <div className="w-full p-10 px-0 mx-0">
          <NavigationBar variant="signup" />
        </div>

        <div className="w-[60%] flex flex-row justify-between mt-8">
          <h1 className="text-4xl font-bold text-primary-red">Sign Up</h1>
          <PhaseIndicator currentStep={currentStep} steps={steps} />
        </div>

        <div className="w-[60%] h-full flex flex-col mt-10">
          <PhaseContainer
            label={steps[currentStep - 1]}
            title={currentStep === 1 ? getEmailVerificationTitle() : undefined}
          >
            {renderPhaseContent()}
          </PhaseContainer>
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
