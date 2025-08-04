import { Textfield } from "../index";
import { Button } from "@/components";

export const EmailInputState = ({ email, onChange, onSendVerification, loading, error }) => {
  const isValidEmail = email.includes("@");

  return (
    <>
      <Textfield
        label="Email Address"
        type="email"
        value={email}
        onChange={onChange}
        required
        error={
          !isValidEmail && email.length > 0
            ? "Please enter a valid email address."
            : ""
        }
      />
      
      {/* Display API error if exists */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="flex justify-end mt-6">
        <Button
          variant="darkred"
          onClick={onSendVerification}
          disabled={!isValidEmail || loading}
        >
          {loading ? 'SENDING...' : 'SEND VERIFICATION EMAIL'}
        </Button>
      </div>
    </>
  );
};
