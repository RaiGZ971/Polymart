import { useState } from 'react';
import { AuthService } from '../services/authService.js';

export const useEmailVerification = () => {
  const [emailVerificationStep, setEmailVerificationStep] = useState('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Real API functions
  const sendEmailVerification = async (email) => {
    try {
      setError(null);
      const response = await AuthService.sendEmailVerification(email);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Verification handlers
  const handleSendVerification = async (email) => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setEmailVerificationStep('sending');
      
      const result = await sendEmailVerification(email);
      
      if (result.success) {
        setEmailVerificationStep('sent');  
      } else {
        throw new Error(result.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      setError(error.message || 'Failed to send verification email. Please try again.');
      setEmailVerificationStep('failed');
    } finally {
      setLoading(false);
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
    loading,
    error,
    setError
  };
};