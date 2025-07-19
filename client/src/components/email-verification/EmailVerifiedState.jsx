import { CheckCircle } from "lucide-react";

export const EmailVerifiedState = ({ email }) => {
  return (
    <div className="text-center space-y-6 w-[80%] mx-auto">
      <div className="flex justify-center">
        <CheckCircle className="w-20 h-20 text-primary-red" />
      </div>
      <div>
        <h3 className="text-3xl font-bold text-primary-red mb-5">Email Verified</h3>
        <p className="text-gray-800 mb-4">
          Thank you for signing up for PolyMart! 
          Your email <strong>{email}</strong> has been successfully verified.
        </p>
        <p className="text-gray-800">
          You can now proceed with your account setup and student verification to access full features of the app.
        </p>
      </div>
    </div>
  );
};