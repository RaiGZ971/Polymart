import { createPortal } from "react-dom";

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  type = "alert",
  onConfirm,
  children,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 z-[100000] flex items-center justify-center bg-black bg-opacity-40 m-0 p-0">
      <div className="bg-white rounded-xl p-8 max-w-md w-full relative text-left">
        <h2 className="text-xl font-bold mb-4 text-primary-red">{title}</h2>
        <p className="mb-6">{description}</p>
        {children}
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
          {type === "alert" && (
            <button
              className="bg-primary-red text-white px-6 py-2 rounded-full"
              onClick={onConfirm}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
