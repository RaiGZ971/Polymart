import { createPortal } from "react-dom";
import { Textfield, Textarea } from "../../components";

const Modal = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
  description,
  children,
  offerPrice,
  setOfferPrice,
  offerMessage,
  setOfferMessage,
}) => {
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 z-[100000] flex items-center justify-center bg-black bg-opacity-40 m-0 p-0">
      <div className="bg-white rounded-xl p-8 max-w-md w-full relative text-left">
        <h2 className="text-xl font-bold mb-4 text-primary-red">{title}</h2>
        <p className="mb-6">{description}</p>
        {children}
        {type === "offer" && (
          <div className="mb-6 flex flex-col gap-4">
            <Textfield
              label="Offer Price"
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              required
              integerOnly
            />
            <Textarea
              label="Tell the seller what you need"
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              maxLength={500}
              required
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          {type === "confirm" && (
            <>
              <button
                className="border border-primary-red text-primary-red px-6 py-2 rounded-full"
                onClick={onClose}
              >
                CANCEL
              </button>
              <button
                className="bg-primary-red text-white px-6 py-2 rounded-full"
                onClick={onConfirm}
              >
                CONFIRM
              </button>
            </>
          )}
          {type === "confirmation" && (
            <>
              <button
                className="border border-primary-red text-primary-red px-6 py-2 rounded-full"
                onClick={onClose}
              >
                Review Details
              </button>
              <button
                className="bg-primary-red text-white px-6 py-2 rounded-full"
                onClick={onConfirm}
              >
                Submit Listing
              </button>
            </>
          )}
          {type === "alert" && (
            <button
              className="bg-primary-red text-white px-6 py-2 rounded-full"
              onClick={onConfirm}
            >
              OK
            </button>
          )}
          {type === "message" && (
            <>
              <button
                className="border border-primary-red text-primary-red px-6 py-2 rounded-full"
                onClick={onClose}
              >
                CANCEL
              </button>
              <button
                className="bg-primary-red text-white px-6 py-2 rounded-full"
                onClick={onConfirm}
              >
                {title.includes("Accept") ? "ACCEPT" : "REJECT"}
              </button>
            </>
          )}
          {type === "offer" && (
            <>
              <button
                className="border border-primary-red text-primary-red px-6 py-2 rounded-full"
                onClick={onClose}
              >
                CANCEL
              </button>
              <button
                className="bg-primary-red text-white px-6 py-2 rounded-full"
                onClick={onConfirm}
              >
                MAKE OFFER
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
