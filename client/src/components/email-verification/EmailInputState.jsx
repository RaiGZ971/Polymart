import { Textfield } from "../index";
import { Button } from "@/components";

export const EmailInputState = ({ email, onChange, onSendVerification }) => {
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
      <div className="flex justify-end mt-6">
        <Button
          variant="darkred"
          onClick={onSendVerification}
          disabled={!isValidEmail}
        >
          SEND VERIFICATION EMAIL
        </Button>
      </div>
    </>
  );
};
