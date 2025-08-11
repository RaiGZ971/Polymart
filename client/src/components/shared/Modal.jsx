import { createPortal } from "react-dom";
import { Textfield, Textarea, Button } from "@/components";

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
  confirmText,
  disabled = false,
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
              <Button variant="outline" onClick={onClose}>
                CANCEL
              </Button>
              <Button variant="primary" onClick={onConfirm}>
                CONFIRM
              </Button>
            </>
          )}
          {type === "confirmation" && (
            <>
              <Button variant="outline" onClick={onClose} disabled={disabled}>
                Review Details
              </Button>
              <Button className="primary" onClick={onConfirm} disabled={disabled}>
                {confirmText || "Submit Listing"}
              </Button>
            </>
          )}
          {type === "alert" && (
            <Button variant="primary" onClick={onConfirm}>
              OK
            </Button>
          )}
          {type === "message" && (
            <>
              <Button variant="outline" onClick={onClose}>
                CANCEL
              </Button>
              <Button variant="primary" onClick={onConfirm}>
                {title.includes("Accept") || title.includes("Confirm") ? 
                  (title.includes("Accept") ? "ACCEPT" : "CONFIRM") : 
                  "REJECT"}
              </Button>
            </>
          )}
          {type === "offer" && (
            <>
              <Button variant="outline" onClick={onClose}>
                CANCEL
              </Button>
              <Button variant="primary" onClick={onConfirm}>
                MAKE OFFER
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
