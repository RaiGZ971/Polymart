import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

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
import { AuthService } from "../../services/authService";

import { useSignUpNavigation } from "../../hooks/useSignUpNavigation";
import { useEmailVerification } from "../../hooks/useEmailVerification";
import { useEmailVerificationRenderer } from "../../hooks/useEmailVerificationRenderer";
import { useFieldRenderer } from "../../hooks/useFieldRenderer";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useFormData } from "../../hooks/useFormData";

export default function SignUp() {
  const [searchParams] = useSearchParams();
  
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

  const handleSubmit = async () => {
    try {
      console.log("Raw form data:", formData);
      
      // Validate required fields before sending
      const requiredFields = {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        birthDate: formData.birthDate,
        contactNumber: formData.contactNumber,
        course: formData.course,
        universityBranch: formData.universityBranch,
        college: formData.college,
        studentID: formData.studentID,
      };

      // Check for missing required fields
      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value || value.trim() === '')
        .map(([key, value]) => key);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Transform form data to match backend API
      const signupData = {
        username: formData.username,
        first_name: formData.firstName,
        middle_name: formData.middleName || "",
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        birthdate: formData.birthDate, // ISO date string YYYY-MM-DD
        contact_number: formData.contactNumber,
        course: formData.course,
        university_branch: formData.universityBranch,
        college: formData.college,
        student_number: formData.studentID,
        pronouns: formData.pronouns || "",
        bio: formData.bio || ""
      };

      console.log("Transformed signup data being sent:", signupData);

      const result = await AuthService.signUp(signupData);
      
      if (result.success) {
        console.log("Signup successful:", result);
        // Handle successful signup - could show success message or redirect
      } else {
        throw new Error(result.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert(`Signup failed: ${error.message}`);
    }
  };

  // Use the email verification hook
  const {
    emailVerificationStep,
    setEmailVerificationStep,
    handleSendVerification,
    handleResendVerification,
    handleChangeEmail,
    handleTestVerification,
    getEmailVerificationTitle,
    loading,
    error,
    setError
  } = useEmailVerification();

  // Handle URL parameters for email verification
  useEffect(() => {
    const sessionToken = searchParams.get('session');
    const verificationError = searchParams.get('verification_error');

    if (sessionToken) {
      // Verify the session token with the backend
      const verifySession = async () => {
        try {
          setError(null);
          const result = await AuthService.verifyVerificationSession(sessionToken);
          
          if (result.success && result.data?.email) {
            // Session is valid, set email and mark as verified
            setFormData(prev => ({ ...prev, email: result.data.email }));
            setEmailVerificationStep('verified');
            
            // Clean up URL by removing the session parameter
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('session');
            window.history.replaceState({}, '', newUrl);
          } else {
            throw new Error('Invalid verification session');
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          setError(`Email verification failed: ${error.message}`);
          setEmailVerificationStep('failed');
          
          // Clean up URL
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('session');
          window.history.replaceState({}, '', newUrl);
        }
      };
      
      verifySession();
    } else if (verificationError) {
      // Show error message
      setError(`Email verification failed: ${decodeURIComponent(verificationError)}`);
      setEmailVerificationStep('failed');
    }
  }, [searchParams, setFormData, setEmailVerificationStep, setError]);

  // Use the navigation hook
  const {
    currentStep,
    step5SubStep,
    nextStep,
    prevStep,
    canGoBack,
    canGoForward,
    getNextButtonText,
    setCurrentStep,
  } = useSignUpNavigation(
    emailVerificationStep,
    handleSubmit,
    formData,
    fieldConfig,
    phaseConfig
  );

  // Auto-advance to step 2 if email is verified via session
  useEffect(() => {
    const sessionToken = searchParams.get('session');
    if (sessionToken && emailVerificationStep === 'verified' && currentStep === 1) {
      // Small delay to ensure state is updated
      setTimeout(() => setCurrentStep(2), 100);
    }
  }, [emailVerificationStep, currentStep, searchParams, setCurrentStep]);

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
      loading,
      error,
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
