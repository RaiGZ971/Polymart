import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Textfield,
  NavigationBar,
  Dropdown,
  DateDropdown,
  PhaseContainer,
  Footer,
  Textarea,
  Add,
  FilePreview,
  // Add email verification components
  EmailInputState,
  EmailSendingState,
  EmailSentState,
  EmailVerifiedState,
  EmailExpiredState,
  EmailFailedState,
  FileUploadArea,
  ProfilePictureUpload,
  PhaseIndicator
} from "../components";

import { 
  initialFormData,
  fieldConfig,
  phaseConfig,
} from "../data";

import { useSignUpNavigation } from "../hooks/useSignUpNavigation";
import { useEmailVerification } from "../hooks/useEmailVerification";
import { useFieldRenderer } from "../hooks/useFieldRenderer";
import { useFileUpload } from "../hooks/useFileUpload";

export default function SignUp() {
  // Use centralized initial form data
  const [formData, setFormData] = useState(initialFormData);

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
  } = useSignUpNavigation(emailVerificationStep, handleSubmit);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  // Use the file upload hook
  const { handleFileChange, removeFile, getFilePreviewURL } = useFileUpload(formData, setFormData);

  // Enhanced dropdown change handler with field reset logic
  const handleDropdownChange = (field) => (e) => {
    const config = fieldConfig[field] || {};
    const resetFields = config.resetFields || [];
    
    // Create reset object for dependent fields
    const resetObject = {};
    resetFields.forEach(resetField => {
      resetObject[resetField] = "";
    });
    
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
      ...resetObject // Reset dependent fields
    }));
  };

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

  // Email Verification States
  const renderEmailVerificationContent = () => {
    switch (emailVerificationStep) {
      case 'input':
        return (
          <EmailInputState
            email={formData.email}
            onChange={handleChange('email')}
            onSendVerification={handleSendVerificationWithEmail}
          />
        );

      case 'sending':
        return (
          <EmailSendingState email={formData.email} />
        );

      case 'sent':
        return (
          <EmailSentState
            email={formData.email}
            onResend={handleResendVerificationWithEmail}
            onChangeEmail={handleChangeEmailWithReset}
            onTestVerification={handleTestVerification}
          />
        );

      case 'verified':
        return (
          <EmailVerifiedState email={formData.email} />
        );

      case 'expired':
        return (
          <EmailExpiredState
            email={formData.email}
            onResend={handleResendVerificationWithEmail}
            onChangeEmail={handleChangeEmailWithReset}
          />
        );

      case 'failed':
        return (
          <EmailFailedState
            onResend={handleResendVerificationWithEmail}
            onChangeEmail={handleChangeEmailWithReset}
          />
        );

      default:
        return null;
    }
  };

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

    return (
      <PhaseContainer label={phase.label} title={phase.title}>
        <div className="flex flex-col space-y-6">
          {/* Phase 2 - Personal Details */}
          {currentStep === 2 && (
            <>
              <div className="w-full flex flex-row gap-4">
                <div className="w-1/3">{renderField('lastName')}</div>
                <div className="w-1/3">{renderField('firstName')}</div>
                <div className="w-1/3">{renderField('middleName')}</div>
              </div>
              
              <div className="w-full flex flex-row gap-4">
                <div className="w-1/3">{renderField('birthDate')}</div>
                <div className="w-1/3">{renderField('contactNumber')}</div>
                <div className="w-1/3">{renderField('pronouns')}</div>
              </div>
              
              <div className="w-full flex flex-row gap-4">
                <div className="w-1/2">{renderField('password')}</div>
                <div className="w-1/2">{renderField('confirmPassword')}</div>
              </div>
            </>
          )}

          {/* Phase 3 - Student Details */}
          {currentStep === 3 && (
            <>
              <div className="w-full flex flex-row gap-4">
                <div className="w-1/2">{renderField('studentID')}</div>
                <div className="w-1/2">{renderField('universityBranch')}</div>
              </div>
              
              <div className="w-full flex flex-row gap-4">
                <div className="w-full">{renderField('college')}</div>
              </div>
              
              <div className="w-full flex flex-row gap-4">
                <div className="w-full">{renderField('course')}</div>
              </div>
              
              <div className="w-full flex flex-row gap-4">
                <div className="w-1/2">{renderField('yearLevel')}</div>
                <div className="w-1/2">{renderField('expectedGraduation')}</div>
              </div>
            </>
          )}

          {/* Phase 4 - Account Setup */}
          {currentStep === 4 && (
            <>
              <div className="w-full flex-1 flex flex-row gap-4">
                <ProfilePictureUpload
                  profilePicture={formData.profilePicture}
                  onFileChange={handleFileChange('profilePicture')}
                  onRemove={() => removeFile('profilePicture')}
                />
                
                <div className="w-1/2 flex-1 flex flex-col gap-4 text-left">
                  <div className="w-full text-lg text-gray-800 font-semibold">Profile Details</div>
                  <div className="w-full">
                    {renderField('username')}
                  </div>
                  <div className="w-full flex-1">
                    {renderField('bio')}
                  </div>
                </div>
              </div>  
            </>
          )}

          {currentStep === 5 && (
            <>
              {step5SubStep === 1 && (
                <FileUploadArea
                  file={formData.cor}
                  onFileChange={handleFileChange('cor')}
                  onRemove={() => removeFile('cor')}
                  inputId="cor-file-input"
                  acceptTypes="image/*,.pdf"
                  title="Upload your Certificate of Registration"
                  subtitle="Please upload a clear photo of your Certificate of Registration"
                  buttonText="Click to upload COR"
                  allowedFormats="jpg, jpeg, png, or pdf"
                />
              )}
              
              {step5SubStep === 2 && (
                <div className="w-full min-h-[350px] flex-1 flex flex-col gap-4 text-left p-4">
                  <div className="space-y-1">
                    <div className="text-xl text-gray-800 font-semibold">Upload your Student ID Pictures</div>
                    <span className="italic text-gray-400 text-base">Please upload clear photos of both sides of your Student ID</span>
                  </div>
                  
                  <div className="flex flex-row gap-6">
                    <div className="w-1/2">
                      <div className="text-lg font-medium text-gray-700 mb-3">Front Side</div>
                      <Add 
                        onClick={() => document.getElementById('student-id-front-input').click()}
                        text={formData.studentIdFront ? `File selected: ${formData.studentIdFront.name}` : "Click to upload front side"}
                      />
                      
                      <input
                        id="student-id-front-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange('studentIdFront')}
                        className="hidden"
                      />
                      
                      <FilePreview 
                        file={formData.studentIdFront}
                        onRemove={() => removeFile('studentIdFront')}
                        className="max-h-32"
                      />
                    </div>

                    <div className="w-1/2">
                      <div className="text-lg font-medium text-gray-700 mb-3">Back Side</div>
                      <Add 
                        onClick={() => document.getElementById('student-id-back-input').click()}
                        text={formData.studentIdBack ? `File selected: ${formData.studentIdBack.name}` : "Click to upload back side"}
                      />
                      
                      <input
                        id="student-id-back-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange('studentIdBack')}
                        className="hidden"
                      />
                      
                      <FilePreview 
                        file={formData.studentIdBack}
                        onRemove={() => removeFile('studentIdBack')}
                        className="max-h-32"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-row justify-between text-sm text-gray-500 italic mt-4">
                    <p className="mb-2">Files should be in jpg, jpeg, or png format.</p>
                    <p>Maximum file size per image: 3MB</p>
                  </div>
                </div>
              )}
            </>
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
          <PhaseIndicator currentStep={currentStep} />
        </div>
      
        <div className="w-[60%] h-full flex flex-col mt-10">
          {renderPhaseContent()}
        </div>
          
        <div className="w-[60%] flex justify-between mt-20 mb-20">
          <button 
            className={`px-4 py-2 transition-colors duration-200 ${
              !canGoBack()
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:text-hover-red'
            }`}
            onClick={prevStep}
            disabled={!canGoBack()}
          >
            <ChevronLeft className="inline" />
            Back
          </button>
          <button 
            className={`px-4 py-2 rounded-[30px] transition-colors duration-200 ${
              !canGoForward()
                ? 'bg-white text-gray-500 cursor-not-allowed'
                : 'text-primary-red hover:text-hover-red'
            }`}
            onClick={nextStep}
            disabled={!canGoForward()}
          >
            {getNextButtonText()}
            <ChevronRight className="inline" />
          </button>
        </div>
        <Footer variant="dark" className="w-full" />
      </div>
    </>
  );
}
