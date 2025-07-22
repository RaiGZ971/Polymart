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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative text-left">
        <h1 className="text-xl font-bold mb-2 text-primary-red">{title}</h1>
        <p className="mb-6 text-sm">{description}</p>
        {children}
        <div className="flex justify-end gap-2">
          {type === "alert" ? (
            <button
              className="text-sm bg-primary-red text-white px-4 py-2 rounded hover:bg-hover-red"
              onClick={onClose}
            >
              OK
            </button>
          ) : (
            <>
              <button
                className="text-sm border border-primary-red text-primary-red px-4 py-2 rounded-full hover:bg-primary-red hover:text-white"
                onClick={onClose}
              >
                Go Back
              </button>
              <button
                className="text-sm bg-primary-red text-white px-4 py-2 rounded-full hover:bg-hover-red"
                onClick={onConfirm}
              >
                Confirm
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
