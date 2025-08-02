import { 
  EmailInputState,
  EmailSendingState,
  EmailSentState,
  EmailVerifiedState,
  EmailExpiredState,
  EmailFailedState
} from "../components";

export const useEmailVerificationRenderer = (emailVerificationStep, formData, handlers) => {
  const { 
    handleSendVerificationWithEmail,
    handleResendVerificationWithEmail,
    handleChangeEmailWithReset,
    handleTestVerification,
    loading,
    error
  } = handlers;

  const renderEmailVerificationContent = () => {
    switch (emailVerificationStep) {
      case 'input':
        return (
          <EmailInputState
            email={formData.email}
            onChange={handlers.handleChange('email')}
            onSendVerification={handleSendVerificationWithEmail}
            loading={loading}
            error={error}
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
            error={error}
            loading={loading}
          />
        );

      default:
        return null;
    }
  };

  return { renderEmailVerificationContent };
};