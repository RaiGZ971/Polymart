import { useState } from 'react';

export const useEmailVerification = () => {
  const [emailVerificationStep, setEmailVerificationStep] = useState('input');

  // Simulation functions
  const simulateEmailSend = async (email) => {
    console.log(`Simulating email send to: ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, message: "Verification email sent" };
  };

  const simulateVerificationCheck = () => {
    return 'verified';
  };

  // Verification handlers
  const handleSendVerification = async (email) => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    try {
      setEmailVerificationStep('sending');
      const result = await simulateEmailSend(email);
      
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

  const handleResendVerification = async (email) => {
    await handleSendVerification(email);
  };

  const handleChangeEmail = (setFormData) => {
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

  return {
    emailVerificationStep,
    setEmailVerificationStep,
    handleSendVerification,
    handleResendVerification,
    handleChangeEmail,
    handleTestVerification,
    getEmailVerificationTitle,
    simulateVerificationCheck
  };
};