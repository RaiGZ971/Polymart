import { Textfield } from "../index";

export const EmailInputState = ({ email, onChange, onSendVerification }) => {
  return (
    <>
      <Textfield
        label="Email"
        type="email"
        value={email}
        onChange={onChange}
        required
      />
      <div className="flex justify-end mt-6">
        <button
          onClick={onSendVerification}
          className="bg-hover-red text-white px-8 py-3 rounded-[30px] font-bold hover:bg-secondary-red transition-colors duration-200"
        >
          SEND VERIFICATION EMAIL
        </button>
      </div>
    </>
  );
};