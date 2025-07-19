export const EmailSendingState = ({ email }) => {
  return (
    <div className="text-center space-y-6 w-[80%] mx-auto font-montserrat">
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-red"></div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-primary-red mb-5">Sending verification email</h3>
        <p className="text-gray-600">
          Please wait while we send a verification link to <strong>{email}</strong>.
        </p>
      </div>
    </div>
  );
};