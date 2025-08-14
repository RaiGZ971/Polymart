import { XCircle } from "lucide-react";

export const EmailFailedState = ({ onResend, onChangeEmail, error, loading }) => {
  // Check for specific error types to provide better messaging
  const isEmailAlreadyExists = error && error.toLowerCase().includes('already verified') || 
                              error && error.toLowerCase().includes('existing account');
  const isGenericError = error && error.includes('HTTP error status');

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <XCircle className="w-20 h-20 text-primary-red" />
      </div>
      <div>
        <h3 className="text-3xl font-bold text-primary-red mb-5">
          {isEmailAlreadyExists ? 'Email Already Registered' : 'Verification failed'}
        </h3>
        {error ? (
          <div className="space-y-3">
            {isEmailAlreadyExists ? (
              <>
                <p className="text-gray-600 mb-4">
                  This email address is already verified and associated with an existing account.
                </p>
                <p className="text-sm text-gray-500">
                  If this is your account, please{' '}
                  <a href="/sign-in" className="text-primary-red hover:text-hover-red underline">
                    sign in instead
                  </a>
                  . If you believe this is an error, try using a different email address.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  {isGenericError ? 
                    "We couldn't send the verification email. Please check your email address and try again." : 
                    error
                  }
                </p>
                {isGenericError && (
                  <p className="text-sm text-gray-500">
                    If the problem persists, please contact support.
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              We couldn't verify your email address. The link may be invalid or
              already used.
            </p>
            <p className="text-sm text-gray-500">
              Please try requesting a new verification email.
            </p>
          </>
        )}
      </div>
      <div className="space-y-3">
        {!isEmailAlreadyExists && (
          <button
            onClick={onResend}
            disabled={loading}
            className="bg-primary-red text-white px-6 py-3 rounded-[30px] hover:bg-hover-red transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send new verification email'}
          </button>
        )}
        <div>
          <button
            onClick={onChangeEmail}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Use a different email address
          </button>
        </div>
      </div>
    </div>
  );
};
