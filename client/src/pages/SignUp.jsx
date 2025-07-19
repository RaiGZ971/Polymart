import { useState } from "react";
import { ChevronLeft, ChevronRight, Mail, CheckCircle, XCircle, Clock, Trash } from "lucide-react";

import {
  Textfield,
  NavigationBar,
  Dropdown,
  DateDropdown,
  PhaseContainer,
  Footer,
  Textarea,
  Add
} from "../components";

import { 
  initialFormData,
  fieldConfig,
  phaseConfig,
} from "../data";

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [emailVerificationStep, setEmailVerificationStep] = useState('input');
  const [step5SubStep, setStep5SubStep] = useState(1); // New state for step 5 substeps
  
  // Use centralized initial form data
  const [formData, setFormData] = useState(initialFormData);

  // Helper function to get field value with auto-formatting
  const getFieldValue = (fieldName) => {
    const config = fieldConfig[fieldName] || {};
    const value = formData[fieldName] || "";
    
    // Apply uppercase if configured
    if (config.uppercase && typeof value === 'string') {
      return value.toUpperCase();
    }
    
    return value;
  };

  // Helper function to check if field is required
  const isFieldRequired = (fieldName) => {
    return fieldConfig[fieldName]?.required || false;
  };

  // Helper function to get field props
  const getFieldProps = (fieldName) => {
    const config = fieldConfig[fieldName] || {};
    return {
      required: config.required,
      integerOnly: config.integerOnly,
      studID: config.studID,
      type: config.type === 'password' ? 'password' : undefined
    };
  };

  // Enhanced helper function to get dropdown options
  const getFieldOptions = (fieldName) => {
    const config = fieldConfig[fieldName] || {};
    
    // Static options
    if (config.options) {
      return config.options;
    }
    
    // Dynamic options (like courses based on college)
    if (config.dynamicOptions) {
      return config.dynamicOptions(formData);
    }
    
    return [];
  };

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

  // <-------- VERIFICATION SIMULATION STARTS HERE ---------->
  const simulateEmailSend = async (email) => {
    console.log(`Simulating email send to: ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, message: "Verification email sent" };
  };

  const simulateVerificationCheck = () => {
    return 'verified';
  };

  const handleSendVerification = async () => {
    if (!formData.email) {
      alert('Please enter your email address');
      return;
    }

    try {
      setEmailVerificationStep('sending');
      const result = await simulateEmailSend(formData.email);
      
      if (result.success) {
        setEmailVerificationStep('sent');  
      } else {
        throw new Error('Failed to send verification email');
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      alert('Failed to send verification email. Please try again.');
      setEmailVerificationStep('input');
    }
  };
  // <------------ VERIFICATION SIMULATION ENDS HERE ----------->

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleFileChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.files[0]
    }));
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
  };

  // <--------- Navigation Handlers ---------->
  const nextStep = () => {
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
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // <--------- Email Verification Handlers ---------->

  const handleResendVerification = async () => {
    await handleSendVerification();
  };

  const handleChangeEmail = () => {
    setEmailVerificationStep('input');
    setFormData(prev => ({ ...prev, email: '' }));
  };

  const handleTestVerification = (status) => {
    setEmailVerificationStep(status);
  };

  const getEmailVerificationTitle = () => {
    switch (emailVerificationStep) {
      case 'input':
        return "Enter your active email";
      case 'sending':
      case 'sent':
      case 'verified':
      case 'expired':
      case 'failed':
        return "";
      default:
        return "Enter your active email";
    }
  };

  // Email Verification States
  const renderEmailVerificationContent = () => {
    switch (emailVerificationStep) {
      case 'input':
        return (
          <>
            <Textfield
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
            />
            <div className="flex justify-end mt-6">
              <button
                onClick={handleSendVerification}
                className="bg-hover-red text-white px-8 py-3 rounded-[30px] font-bold hover:bg-secondary-red transition-colors duration-200"
              >
                SEND VERIFICATION EMAIL
              </button>
            </div>
          </>
        );

      case 'sending':
        return (
          <div className="text-center space-y-6 w-[80%] mx-auto font-montserrat">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-red"></div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary-red mb-5">Sending verification email</h3>
              <p className="text-gray-600">
                Please wait while we send a verification link to <strong>{formData.email}</strong>.
              </p>
            </div>
          </div>
        );

      case 'sent':
        return (
          <div className="text-center space-y-6 font-montserrat">
            <div className="flex justify-center">
              <Mail className="w-20 h-20 text-primary-red" />
            </div>

            <div className="w-[80%] mx-auto">
              <h3 className="text-3xl font-bold text-primary-red mb-5">Check your mail</h3>
              <p className="text-gray-800 mb-4">
                We've sent a verification link to <strong>{formData.email}.</strong> Please check your inbox/spam and click the link to verify your account.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-center"> Didn't receive your mail? Check your spam folder or
                <button
                  onClick={handleResendVerification}
                  className="pl-2 text-primary-red hover:text-hover-red hover:underline font-medium"
                >
                  Resend verification email
                </button>
              </div>
              <div className="text-center">
                <button
                  onClick={handleChangeEmail}
                  className="text-gray-500 hover:text-gray-700 hover:underline text-sm"
                >
                  Use a different email address
                </button>
              </div>
            </div>
            
            {/* Testing buttons */}
            <div className="border-t pt-4 mt-6">
              <p className="text-xs text-gray-400 mb-2">Testing Controls:</p>
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => handleTestVerification('verified')}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                >
                  Simulate Verified
                </button>
                <button
                  onClick={() => handleTestVerification('expired')}
                  className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"
                >
                  Simulate Expired
                </button>
                <button
                  onClick={() => handleTestVerification('failed')}
                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                >
                  Simulate Failed
                </button>
              </div>
            </div>
          </div>
        );

      case 'verified':
        return (
          <div className="text-center space-y-6 w-[80%] mx-auto">
            <div className="flex justify-center">
              <CheckCircle className="w-20 h-20 text-primary-red" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary-red mb-5">Email Verified</h3>
              <p className="text-gray-800 mb-4">
                Thank you for signing up for PolyMart! 
                Your email <strong>{formData.email}</strong> has been successfully verified.
              </p>
              <p className="text-gray-800">
                You can now proceed with your account setup and student verification to access full features of the app.
              </p>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Clock className="w-20 h-20 text-primary-red" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary-red mb-5">Verification link expired</h3>
              <p className="text-gray-800 mb-4">
                The verification link for <strong>{formData.email}</strong> has expired.
              </p>
              <p className="text-gray-800 mb-4">
                Please request a new verification email to continue.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                className="bg-hover-red text-white px-6 py-3 rounded-[30px] hover:bg-secondary-red transition-colors duration-200"
              >
                Send new verification email
              </button>
              <div>
                <button
                  onClick={handleChangeEmail}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Verification failed</h3>
              <p className="text-gray-600 mb-4">
                We couldn't verify your email address. The link may be invalid or already used.
              </p>
              <p className="text-sm text-gray-500">
                Please try requesting a new verification email.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                className="bg-primary-red text-white px-6 py-3 rounded-[30px] hover:bg-hover-red transition-colors duration-200"
              >
                Send new verification email
              </button>
              <div>
                <button
                  onClick={handleChangeEmail}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Updated render function using configuration
  const renderField = (fieldName) => {
    const config = fieldConfig[fieldName];
    if (!config) return null;

    const commonProps = {
      label: config.label,
      value: config.component === 'textfield' ? getFieldValue(fieldName) : formData[fieldName],
      required: config.required,
      disabled: config.disabled
    };

    switch (config.component) {
      case 'textfield':
        return (
          <Textfield
            {...commonProps}
            onChange={handleChange(fieldName)}
            {...getFieldProps(fieldName)}
          />
        );
      
      case 'dropdown':
        return (
          <Dropdown
            {...commonProps}
            onChange={handleDropdownChange(fieldName)}
            options={getFieldOptions(fieldName)}
          />
        );
      
      case 'dateDropdown':
        return (
          <DateDropdown
            {...commonProps}
            onChange={handleChange(fieldName)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            onChange={handleChange(fieldName)}
            maxLength={config.maxLength}
            rows={config.rows}
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
              {/* Main Container*/}
              <div className="w-full flex-1 flex flex-row gap-4">
                {/* Left Col - Profile Picture */}
                <div className="w-1/2 flex flex-col gap-4 -ml-11">
                  <div className="p-8 text-center flex flex-col items-center justify-center hover:border-gray-400 transition-colors duration-200">
                    {formData.profilePicture ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={URL.createObjectURL(formData.profilePicture)} 
                          alt="Profile Preview" 
                          className="w-52 h-52 rounded-full object-cover mb-4"
                        />
                        <p className="text-sm text-gray-600 mb-2">{formData.profilePicture.name}</p>
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, profilePicture: null }))}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center">
                        <div className="w-52 h-52 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="text-gray-800 font-medium mb-1">Upload Profile Picture</span>
                        <span className="text-gray-400 text-sm">Click to browse files</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange('profilePicture')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Right Col - Username and Bio */}
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
                <div className="w-full min-h-[350px] flex-1 flex flex-col gap-4 text-left p-4">
                  <div className="space-y-1">
                    <div className="text-xl text-gray-800 font-semibold">Upload your Certificate of Registration</div>
                    <span className="italic text-gray-400 text-base">Please upload a clear photo of your Certificate of Registration</span>
                  </div>
                  
                  {/* Add component with file upload functionality */}
                  <Add 
                    onClick={() => document.getElementById('cor-file-input').click()}
                    text={formData.cor ? `File selected: ${formData.cor.name}` : "Click to upload COR"}
                  />
                  
                  {/* Hidden file input */}
                  <input
                    id="cor-file-input"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange('cor')}
                    className="hidden"
                  />
                  
                  {/* File preview section */}
                  {formData.cor && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary-red rounded flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formData.cor.name}</p>
                            <p className="text-xs text-gray-500">{(formData.cor.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, cor: null }))}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                      <img 
                        src={URL.createObjectURL(formData.cor)} 
                        alt="COR Preview" 
                        className="w-full h-auto max-h-[200px] rounded border object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-row justify-between text-sm text-gray-500 italic mt-4">
                    <p className="mb-2">Files should be in jpg, jpeg, or png format.</p>
                    <p>Maximum file size per image: 3MB</p>
                  </div>
                </div>
              )}

              {step5SubStep === 2 && (
                <div className="w-full min-h-[350px] flex-1 flex flex-col gap-4 text-left p-4">
                  <div className="space-y-1">
                    <div className="text-xl text-gray-800 font-semibold">Upload your Student ID Pictures</div>
                    <span className="italic text-gray-400 text-base">Please upload clear photos of both sides of your Student ID</span>
                  </div>
                  
                  <div className="flex flex-row gap-6">
                    {/* Front ID Upload */}
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
                      
                      {formData.studentIdFront && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-primary-red rounded flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{formData.studentIdFront.name}</p>
                                <p className="text-xs text-gray-500">{(formData.studentIdFront.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setFormData(prev => ({ ...prev, studentIdFront: null }))}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                          <img 
                            src={URL.createObjectURL(formData.studentIdFront)} 
                            alt="Student ID Front Preview" 
                            className="w-full h-auto max-h-32 rounded border object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Back ID Upload */}
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
                      
                      {formData.studentIdBack && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-primary-red rounded flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{formData.studentIdBack.name}</p>
                                <p className="text-xs text-gray-500">{(formData.studentIdBack.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setFormData(prev => ({ ...prev, studentIdBack: null }))}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                          <img 
                            src={URL.createObjectURL(formData.studentIdBack)} 
                            alt="Student ID Back Preview" 
                            className="w-full h-auto max-h-32 rounded border object-cover"
                          />
                        </div>
                      )}
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
              (currentStep === 1 || (currentStep === 5 && step5SubStep === 1))
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:text-hover-red'
            }`}
            onClick={prevStep}
            disabled={currentStep === 1 || (currentStep === 5 && step5SubStep === 1)}
          >
            <ChevronLeft className="inline" />
            Back
          </button>
          <button 
            className={`px-4 py-2 rounded-[30px] transition-colors duration-200 ${
              (currentStep === 1 && emailVerificationStep !== 'verified')
                ? 'bg-white text-gray-500 cursor-not-allowed'
                : 'text-primary-red hover:text-hover-red'
            }`}
            onClick={nextStep}
            disabled={currentStep === 1 && emailVerificationStep !== 'verified'}
          >
            {(currentStep === 5 && step5SubStep === 2) ? 'Submit Application' : 'Next'}
            <ChevronRight className="inline" />
          </button>
        </div>
        <Footer variant="dark" className="w-full" />
      </div>
    </>
  );
}

function PhaseIndicator({ currentStep }) {
  const steps = [
    'Email Verification',
    'Personal Details', 
    'Student Details',
    'Account Setup',
    'Student Verification',
  ];

  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((label, index) => {
        const step = index + 1;
        const isPassed = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div className="flex items-center font-montserrat " key={step}>
            <div className="flex flex-col items-center space-y-1">
              <div
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-bold
                  ${isCurrent ? 'bg-hover-red text-white border-hover-red' : ''}
                  ${isPassed ? 'bg-white text-hover-red border-hover-red' : ''}
                  ${!isPassed && !isCurrent ? 'bg-white text-gray-300 border-gray-300' : ''}
                `}
              >
                {step}
              </div>
              <div
                className={`
                  text-xs text-center w-20
                  ${isCurrent ? 'text-hover-red' : ''}
                  ${isPassed ? 'text-hover-red' : ''}
                  ${!isPassed && !isCurrent ? 'text-gray-300' : ''}
                `}
              >
                {label}
              </div>
            </div>

            {step !== steps.length && (
             <div className="flex-1 flex items-center justify-center -mt-8">
                <div
                  className={`
                    w-10 h-0.5
                    ${isPassed ? 'bg-hover-red' : 'bg-gray-300'}
                  `}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
