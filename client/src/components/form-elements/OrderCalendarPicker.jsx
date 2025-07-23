import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import timeSlots from "../../data/timeSlots";

export default function OrderCalendarPicker({
  availableSchedules = [],
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  disabled = false,
}) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  // Calendar display
  const displayDate = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset,
    1
  );
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

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

  // Dates with available times
  const availableDates = availableSchedules.map((sched) => sched.date);

  // Times for selected date (should be value strings)
  const availableTimes =
    availableSchedules.find((sched) => sched.date === selectedDate)?.times ||
    [];

  // Map availableTimes (labels) to values
  const availableTimeValues = timeSlots
    .filter(
      (slot) =>
        availableTimes.includes(slot.value) ||
        availableTimes.includes(slot.label)
    )
    .map((slot) => slot.value);

  // Calendar grid
  const renderCalendar = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array(firstDay)
      .fill(null)
      .map((_, i) => (
        <div key={`empty-${i}`} className="w-full aspect-square" />
      ));
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const isAvailable = availableDates.includes(dateStr);
      const isSelected = selectedDate === dateStr;
      const isPast =
        new Date(year, month, day) <
        new Date(today.getFullYear(), today.getMonth(), today.getDate());
      days.push(
        <button
          key={day}
          type="button"
          className={`relative w-full aspect-square flex items-center justify-center text-xs rounded-full text-center transition
            ${isSelected ? "bg-primary-red text-white" : ""}
            ${
              isAvailable && !isPast
                ? "bg-gray-100 text-gray-800 font-semibold hover:bg-primary-red hover:text-white"
                : isPast
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-300"
            }
            m-0 p-0`}
          disabled={disabled || isPast || !isAvailable}
          onClick={() => {
            if (!isPast && isAvailable) {
              onDateChange(dateStr);
              onTimeChange(""); // reset time when date changes
            }
          }}
          style={{ minHeight: 0, minWidth: 0, lineHeight: 1 }}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="border rounded p-2">
          <div className="flex justify-between items-center mb-2 border-b pb-2 text-primary-red">
            <button
              className="px-2 py-1 text-xs rounded hover:bg-gray-100 disabled:opacity-50 flex items-center"
              onClick={() => setMonthOffset((m) => m - 1)}
              disabled={monthOffset === 0}
              aria-label="Previous Month"
            >
              <ChevronLeft size={18} className="text-primary-red" />
            </button>
            <span className="font-bold text-sm">
              {monthNames[month].toUpperCase()} {year}
            </span>
            <button
              className="px-2 py-2 text-xs rounded-full hover:bg-gray-100 disabled:opacity-50 flex items-center"
              onClick={() => setMonthOffset((m) => m + 1)}
              disabled={monthOffset === 2}
              aria-label="Next Month"
            >
              <ChevronRight size={18} className="text-primary-red" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-1 text-xs text-gray-500 text-center">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </div>
        <div className="border rounded p-2">
          <h4 className="font-semibold text-base mb-2 px-2 text-primary-red">
            Available Time Slots
          </h4>
          {!selectedDate ? (
            <div className="text-gray-400 text-xs">
              Select a date to view times.
            </div>
          ) : availableTimes.length === 0 ? (
            <div className="text-gray-400 text-xs">
              No available times for this date.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {timeSlots
                .filter((slot) => availableTimeValues.includes(slot.value))
                .map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    className={`px-4 py-1 rounded-full border text-sm font-semibold text-center transition ${
                      selectedTime === slot.value
                        ? "bg-primary-red text-white border-primary-red"
                        : "text-primary-red border-primary-red hover:bg-primary-red hover:text-white"
                    }`}
                    onClick={() => onTimeChange(slot.value)}
                    disabled={disabled}
                  >
                    {slot.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
