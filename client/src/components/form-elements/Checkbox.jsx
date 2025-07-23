export default function Checkbox({
  label,
  checked,
  onChange,
  id,
  disabled = false,
  options = [],
}) {
  // If options are provided, render multiple checkboxes
  if (options && options.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="checkbox"
                id={`${id}-${option.value}`}
                checked={checked && checked.includes(option.value)}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  const currentValues = checked || [];
                  const newValues = isChecked
                    ? [...currentValues, option.value]
                    : currentValues.filter((val) => val !== option.value);
                  onChange({ target: { value: newValues } });
                }}
                disabled={disabled}
                className="sr-only"
              />
              <label
                htmlFor={`${id}-${option.value}`}
                className={`flex items-center justify-center w-5 h-5 border-2 rounded cursor-pointer transition duration-200 ${
                  checked && checked.includes(option.value)
                    ? "bg-primary-red text-white border-primary-red"
                    : "border-gray-400 hover:border-primary-red"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {checked && checked.includes(option.value) && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </label>
            </div>
            <label
              htmlFor={`${id}-${option.value}`}
              className={`text-sm font-medium text-gray-700 cursor-pointer ${
                disabled ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
    );
  }

  // Single checkbox (original functionality)
  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <label
          htmlFor={id}
          className={`flex items-center justify-center w-5 h-5 border-2 rounded cursor-pointer transition duration-200 ${
            checked
              ? "bg-primary-red text-white border-primary-red"
              : "border-gray-400 hover:border-primary-red"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          {checked && (
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </label>
      </div>
      {label && (
        <label
          htmlFor={id}
          className={`text-sm font-medium text-gray-700 cursor-pointer ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {label}
        </label>
      )}
    </div>
  );
}
