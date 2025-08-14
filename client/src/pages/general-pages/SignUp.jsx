import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

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
import { AuthService, FileUploadService, UserService } from "../../services";

import { useSignUpNavigation } from "../../hooks/useSignUpNavigation";
import { useEmailVerification } from "../../hooks/useEmailVerification";
import { useEmailVerificationRenderer } from "../../hooks/useEmailVerificationRenderer";
import { useFieldRenderer } from "../../hooks/useFieldRenderer";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useFormData } from "../../hooks/useFormData";
import { useAuthStore } from "../../store/authStore.js";

export default function SignUp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasAutoAdvanced = useRef(false);
  
  // Get setUser from Zustand store to store auth token
  const { setUser, setUserProfile } = useAuthStore();
  
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
        username: formData.username?.trim(),
        first_name: formData.firstName?.trim(),
        middle_name: formData.middleName?.trim() || "",
        last_name: formData.lastName?.trim(),
        email: formData.email?.trim(),
        password: formData.password,
        birthdate: formData.birthDate, // ISO date string YYYY-MM-DD
        contact_number: formData.contactNumber?.trim(),
        course: formData.course?.trim(),
        university_branch: formData.universityBranch?.trim(),
        college: formData.college?.trim(),
        student_number: formData.studentID?.trim(),
        pronouns: formData.pronouns?.trim() || "",
        bio: formData.bio?.trim() || ""
      };

      console.log("Transformed signup data being sent:", signupData);

      // Step 1: Create user account
      const result = await AuthService.signUp(signupData);
      
      if (!result.success) {
        throw new Error(result.message || "Signup failed");
      }

      console.log("Signup successful:", result);

      // Step 2: Login to get authentication token for file uploads
      const loginData = {
        student_number: formData.studentID?.trim(),
        password: formData.password
      };

      const loginResult = await AuthService.login(loginData);
      
      if (!loginResult.success) {
        throw new Error("Failed to authenticate after signup");
      }

      console.log("Auto-login successful");

      // Store the authentication token in Zustand store
      setUser(loginResult.data.user.user_id, loginResult.data.access_token);

      // Fetch and store user profile to ensure display name is available immediately
      try {
        const userProfile = await UserService.getUserProfile(loginResult.data.user.user_id);
        setUserProfile({
          username: userProfile.data.username,
          first_name: userProfile.data.first_name
        });
      } catch (profileError) {
        console.warn("Failed to fetch user profile after signup:", profileError);
        // Continue even if profile fetch fails - dashboard will handle it
      }

      // Step 3: Upload profile picture if provided
      if (formData.profilePicture && formData.profilePicture instanceof File) {
        try {
          console.log("Uploading profile picture...");
          const profilePhotoResult = await FileUploadService.uploadProfilePhoto(formData.profilePicture);
          console.log("Profile picture uploaded successfully:", profilePhotoResult);
        } catch (error) {
          console.error("Profile picture upload failed:", error);
          // Continue with signup even if profile picture upload fails
          alert(`Profile picture upload failed: ${error.message}. You can add it later from your profile.`);
        }
      }

      // Step 4: Upload verification documents if provided
      const hasVerificationDocs = formData.studentIdFront && formData.studentIdBack && formData.cor;
      if (hasVerificationDocs) {
        try {
          console.log("Uploading verification documents...");
          const documents = {
            studentIdFront: formData.studentIdFront,
            studentIdBack: formData.studentIdBack,
            cor: formData.cor
          };
          const verificationResult = await FileUploadService.uploadVerificationDocuments(documents);
          console.log("Verification documents uploaded successfully:", verificationResult);
        } catch (error) {
          console.error("Verification documents upload failed:", error);
          // Continue with signup even if verification documents upload fails
          alert(`Verification documents upload failed: ${error.message}. You can submit them later from your profile.`);
        }
      }

      // Step 5: Redirect to dashboard or success page
      alert("Account created successfully! Welcome to PolyMart!");
      navigate('/dashboard');
      
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

  // Auto-advance to step 2 if email is verified via session (only when coming from email link)
  useEffect(() => {
    const sessionToken = searchParams.get('session');
    // Only auto-advance if there's a session token (coming from email verification)
    // and email is verified and currently on step 1 and we haven't auto-advanced before
    if (sessionToken && emailVerificationStep === 'verified' && currentStep === 1 && !hasAutoAdvanced.current) {
      hasAutoAdvanced.current = true;
      // Small delay to ensure state is updated
      setTimeout(() => setCurrentStep(2), 100);
    }
  }, [emailVerificationStep, searchParams, setCurrentStep]); // Removed currentStep from dependencies

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
