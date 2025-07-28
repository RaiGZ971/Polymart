import { Clock } from "lucide-react";

export const EmailExpiredState = ({ email, onResend, onChangeEmail }) => {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <Clock className="w-20 h-20 text-primary-red" />
      </div>
      <div>
        <h3 className="text-3xl font-bold text-primary-red mb-5">
          Verification link expired
        </h3>
        <p className="text-gray-800 mb-4">
          The verification link for <strong>{email}</strong> has expired.
        </p>
        <p className="text-gray-800 mb-4">
          Please request a new verification email to continue.
        </p>
      </div>
      <div className="space-y-3">
        <button
          onClick={onResend}
          className="bg-hover-red text-white px-6 py-3 rounded-[30px] hover:bg-secondary-red transition-colors duration-200"
        >
          Send new verification email
        </button>
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
