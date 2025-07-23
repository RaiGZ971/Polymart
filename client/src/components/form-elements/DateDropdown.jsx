import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";

export default function DateDropdown({
  label = "Date",
  required = false,
  error: externalError = "",
  onBlur,
  onChange,
  value = "",
  minDate = null,
  maxDate = null,
  placeholder = "Select date",
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [internalError, setInternalError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const dropdownRef = useRef(null);

  // Use external error if provided, otherwise use internal error
  const displayError = externalError || internalError;
  const hasError = Boolean(displayError);
  const hasValue = Boolean(value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFocused(hasValue);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hasValue]);

  // Initialize month/year from value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedMonth(date.getMonth());
      setSelectedYear(date.getFullYear());
    }
  }, [value]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setIsFocused(true);
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(selectedYear, selectedMonth, day);
    const dateString = selectedDate.toISOString().split("T")[0];

    if (onChange) {
      onChange({
        target: {
          value: dateString,
        },
      });
    }

    setIsOpen(false);
    setIsFocused(true);

    // Clear error when user makes selection
    if (internalError) {
      setInternalError("");
    }
  };

  const handleBlur = () => {
    if (!isOpen) {
      setIsFocused(hasValue);

      // Validate required field
      if (required && !value) {
        setInternalError(`${label} is required.`);
      } else {
        setInternalError("");
      }

      // Call external onBlur if provided
      if (onBlur) {
        onBlur({ target: { value } });
      }
    }
  };

  // Format display value
  const formatDisplayValue = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Add 1 because getMonth() is 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const isDisabled =
        (minDate && currentDate < new Date(minDate)) ||
        (maxDate && currentDate > new Date(maxDate));

      days.push({
        day,
        date: currentDate,
        isDisabled,
      });
    }

    return days;
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Generate year options (current year ± 50 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);

  const calendarDays = generateCalendarDays();
  const selectedDate = value ? new Date(value) : null;

  return (
    <div className="flex flex-col items-center font-poppins" ref={dropdownRef}>
      {/*Date Dropdown Container*/}
      <div
        className={`border py-3 px-6 rounded-[30px] relative w-64 transition-all duration-200 ease-in-out cursor-pointer ${
          hasError
            ? "border-error-red"
            : isFocused || isOpen
              ? "border-black"
              : "border-gray-400"
        }`}
        onClick={handleToggle}
        onBlur={handleBlur}
      >
        {/*Date Display*/}
        <div className="text-black outline-none bg-transparent w-full font-poppins flex justify-between items-center">
          <span className={hasValue ? "text-black" : "text-transparent"}>
            {formatDisplayValue(value) || placeholder}
          </span>

          {/* Calendar Icon */}
          <Calendar className="w-4 h-4 text-gray-600" />
        </div>

        {/*Date Label*/}
        <span
          className={`absolute left-3 bg-white pointer-events-none px-2 transition-all duration-200 font-poppins ${
            isFocused || hasValue || isOpen
              ? `-top-2 text-xs px-2 ${hasError ? "text-error-red font-bold" : "text-black font-bold"}`
              : `top-3 text-base ${hasError ? "text-error-red" : "text-gray-400"}`
          }`}
        >
          {label}
          {required && <span className="text-error-red ml-1">*</span>}
        </span>

        {/*Calendar Dropdown*/}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-80">
            {/* Month/Year Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-2 py-1 border rounded text-sm font-poppins"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-2 py-1 border rounded text-sm font-poppins"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-gray-500 p-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((dayObj, index) => {
                  if (!dayObj) {
                    return <div key={index} className="p-2"></div>;
                  }

                  const isSelected =
                    selectedDate &&
                    dayObj.date.getTime() === selectedDate.getTime();
                  const isToday =
                    dayObj.date.toDateString() === new Date().toDateString();

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={dayObj.isDisabled}
                      onClick={() => handleDateSelect(dayObj.day)}
                      className={`
                        p-2 text-sm rounded transition-colors duration-150 font-poppins
                        ${
                          isSelected
                            ? "bg-black text-white"
                            : isToday
                              ? "bg-gray-200 text-black font-bold"
                              : dayObj.isDisabled
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-black hover:bg-gray-100"
                        }
                      `}
                    >
                      {dayObj.day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/*Error Message*/}
      {hasError && (
        <span className="text-error-red text-xs mt-2 px-2 max-w-64 text-left italic w-full pl-6 font-poppins">
          {displayError}
        </span>
      )}
    </div>
  );
}
