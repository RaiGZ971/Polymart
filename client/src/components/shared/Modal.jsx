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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl p-8 max-w-md w-full relative text-left">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="mb-6">{description}</p>
        {children}
        <div className="flex justify-end gap-2">
          {type === "confirm" && (
            <>
              <button
                className="border border-primary-red text-primary-red px-6 py-2 rounded-full"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="bg-primary-red text-white px-6 py-2 rounded-full"
                onClick={onConfirm}
              >
                Confirm
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
    </div>
  );
}
