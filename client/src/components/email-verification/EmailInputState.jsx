import { Textfield } from "../index";

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
        <button
          onClick={onSendVerification}
          className="bg-hover-red text-white px-8 py-3 rounded-[30px] font-bold hover:bg-secondary-red transition-colors duration-200"
          disabled={!isValidEmail}
        >
          SEND VERIFICATION EMAIL
        </button>
      </div>
    </>
  );
};
