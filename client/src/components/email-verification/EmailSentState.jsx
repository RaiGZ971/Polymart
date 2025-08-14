import { Mail } from "lucide-react";

export const EmailSentState = ({
  email,
  onResend,
  onChangeEmail,
}) => {
  return (
    <div className="text-center space-y-6 font-montserrat">
      <div className="flex justify-center">
        <Mail className="w-20 h-20 text-primary-red" />
      </div>

      <div className="w-[80%] mx-auto">
        <h3 className="text-3xl font-bold text-primary-red mb-5">
          Check your mail
        </h3>
        <p className="text-gray-800 mb-4">
          We've sent a verification link to <strong>{email}.</strong> Please
          check your inbox/spam and click the link to verify your account.
        </p>
      </div>
      <div className="space-y-3">
        <div className="text-center">
          {" "}
          Didn't receive your mail? Check your spam folder or
          <button
            onClick={onResend}
            className="pl-2 text-primary-red hover:text-hover-red hover:underline font-medium"
          >
            Resend verification email
          </button>
        </div>
        <div className="text-center">
          <button
            onClick={onChangeEmail}
            className="text-gray-500 hover:text-gray-700 hover:underline text-sm"
          >
            Use a different email address
          </button>
        </div>
      </div>
    </div>
  );
};
