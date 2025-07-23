import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarViewer({
  label,
  value = [],
  timeSlots = [],
  disabled = false,
  onDateClick,
}) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);

  // Calculate displayed month/year based on offset
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

  const renderCalendar = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array(firstDay)
      .fill(null)
      .map((_, i) => <div key={`empty-${i}`} className="p-2"></div>);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const isBooked = value.some(([d]) => d === dateStr);
      const dateObj = new Date(year, month, day);
      const isPast =
        dateObj <
        new Date(today.getFullYear(), today.getMonth(), today.getDate());
      days.push(
        <button
          key={day}
          type="button"
          className={`p-2 text-xs rounded-full text-center transition ${
            selectedDate === dateStr ? "bg-primary-red text-white" : ""
          } ${
            isBooked
              ? "bg-gray-100 text-gray-800 font-semibold"
              : isPast
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-primary-red hover:text-white"
          }`}
          disabled={disabled || isPast}
          onClick={() => {
            if (!isPast) {
              setSelectedDate(dateStr);
              if (onDateClick) onDateClick(dateStr);
            }
          }}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  // Filter times for selected date
  const selectedTimes = selectedDate
    ? value.filter(([d]) => d === selectedDate)
    : [];

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
              className="px-2 py-1 text-xs rounded hover:bg-gray-100 disabled:opacity-50 flex items-center"
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
          <h4 className="font-semibold mb-2 text-sm text-primary-red">
            Available Times
          </h4>
          {!selectedDate ? (
            <div className="text-gray-400 text-xs">
              Select a date to view times.
            </div>
          ) : selectedTimes.length === 0 ? (
            <div className="text-gray-400 text-xs">
              No available times for this date.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 overflow-y-auto">
              {selectedTimes.map(([_, time], idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full text-primary-red border border-primary-red text-[10px] font-medium text-center"
                >
                  {timeSlots.find((slot) => slot.value === time)?.label || time}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
