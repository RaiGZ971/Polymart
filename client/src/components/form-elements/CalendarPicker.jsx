import { useState } from "react";

export default function CalendarPicker({
  label,
  value = [],
  onChange,
  timeSlots = [],
  disabled = false,
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Calculate max allowed month (2 months from today)
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 1);
  const maxMonth = maxDate.getMonth();
  const maxYear = maxDate.getFullYear();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
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

  const handleDateClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setSelectedTimes([]);
  };

  const handleTimeToggle = (timeValue) => {
    setSelectedTimes((prev) =>
      prev.includes(timeValue)
        ? prev.filter((t) => t !== timeValue)
        : [...prev, timeValue],
    );
  };

  const handleSave = () => {
    if (!selectedDate || selectedTimes.length === 0) return;

    const newEntries = selectedTimes.map((time) => [selectedDate, time]);
    const updatedValue = [...value, ...newEntries];

    // Pass the updated value directly
    onChange({ target: { value: updatedValue } });
    setSelectedDate("");
    setSelectedTimes([]);
  };

  const removeAvailableDate = (index) => {
    const updatedValue = value.filter((_, i) => i !== index);
    onChange({ target: { value: updatedValue } });
  };

  const renderCalendar = () => {
    const days = [];
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isPast = date < today;
      // Disable if after max allowed date
      const isAfterMax = date >= new Date(maxYear, maxMonth + 1, 1);
      const isSelected = selectedDate === dateStr;
      const hasBooking = value.some(([bookingDate]) => bookingDate === dateStr);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isPast && !isAfterMax && handleDateClick(day)}
          disabled={isPast || isAfterMax || disabled}
          className={`p-3 text-sm rounded-full transition duration-200 ${
            isPast || isAfterMax
              ? "text-gray-300 cursor-not-allowed"
              : isSelected
                ? "bg-primary-red text-white"
                : hasBooking
                  ? "bg-red-100 text-primary-red border border-primary-red"
                  : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          {day}
        </button>,
      );
    }
    return days;
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(year, month - 1))}
              className="p-1 hover:bg-gray-100 rounded"
              disabled={
                disabled ||
                (year === today.getFullYear() && month === today.getMonth())
              }
            >
              ←
            </button>
            <h3 className="font-medium">
              {monthNames[month]} {year}
            </h3>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(year, month + 1))}
              className="p-1 hover:bg-gray-100 rounded-full"
              // Disable if at max allowed month
              disabled={
                disabled ||
                year > maxYear ||
                (year === maxYear && month >= maxMonth)
              }
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-2 text-xs font-medium text-gray-500 text-center"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">
              Select times for {selectedDate}
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {timeSlots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => handleTimeToggle(slot.value)}
                  disabled={disabled}
                  className={`p-2 text-sm rounded-full border transition duration-200 ${
                    selectedTimes.includes(slot.value)
                      ? "bg-primary-red text-white border-primary-red"
                      : "border-gray-300 hover:border-primary-red"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={selectedTimes.length === 0 || disabled}
              className="w-full py-2 bg-primary-red text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
            >
              Save Selected Times
            </button>
          </div>
        )}
      </div>

      {/* Saved Dates */}
      {value.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Saved Available Times</h4>
            <button
              type="button"
              onClick={() => onChange({ target: { value: [] } })}
              disabled={disabled}
              className="text-red-500 hover:text-red-700 text-sm font-semibold px-2 py-1 rounded disabled:opacity-50"
            >
              Remove All
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {value.map(([date, time], index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-gray-50 p-2 rounded"
              >
                <span className="text-sm">
                  {new Date(date).toLocaleDateString()} at{" "}
                  {timeSlots.find((slot) => slot.value === time)?.label || time}
                </span>
                <button
                  type="button"
                  onClick={() => removeAvailableDate(index)}
                  disabled={disabled}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
