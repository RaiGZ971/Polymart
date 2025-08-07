import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import timeSlots from "../../data/timeSlots";

// Import the simplification functions from the utils
const parseTimeValue = (timeStr) => {
  const match = timeStr.match(/^(\d{1,2})(am|pm)$/i);
  if (!match) {
    return 0;
  }
  
  let hours = parseInt(match[1], 10);
  const period = match[2].toLowerCase();
  
  if (period === 'am') {
    if (hours === 12) {
      hours = 0;
    }
  } else {
    if (hours !== 12) {
      hours += 12;
    }
  }
  
  return hours;
};

const simplifyTimeSlots = (schedules) => {
  const simplifiedSchedules = [];
  
  schedules.forEach(schedule => {
    if (!schedule.date || !schedule.times || schedule.times.length === 0) {
      return;
    }
    
    const sortedTimes = [...schedule.times].sort((a, b) => {
      const timeA = parseTimeValue(a.split('-')[0]);
      const timeB = parseTimeValue(b.split('-')[0]);
      return timeA - timeB;
    });
    
    const mergedTimes = [];
    let currentRange = null;
    
    sortedTimes.forEach(timeSlot => {
      const [startStr, endStr] = timeSlot.split('-');
      const startTime = parseTimeValue(startStr);
      const endTime = parseTimeValue(endStr);
      
      if (!currentRange) {
        currentRange = {
          start: startTime,
          end: endTime,
          startStr: startStr,
          endStr: endStr
        };
      } else if (currentRange.end === startTime) {
        currentRange.end = endTime;
        currentRange.endStr = endStr;
      } else {
        mergedTimes.push(`${currentRange.startStr}-${currentRange.endStr}`);
        currentRange = {
          start: startTime,
          end: endTime,
          startStr: startStr,
          endStr: endStr
        };
      }
    });
    
    if (currentRange) {
      mergedTimes.push(`${currentRange.startStr}-${currentRange.endStr}`);
    }
    
    if (mergedTimes.length > 0) {
      simplifiedSchedules.push({
        date: schedule.date,
        times: mergedTimes
      });
    }
  });
  
  return simplifiedSchedules;
};

export default function CalendarPicker({
  label,
  value = [],
  onChange,
  timeSlots: customTimeSlots = timeSlots,
  disabled = false,
}) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  // Local state for time selection before saving
  const [pendingTimes, setPendingTimes] = useState([]);

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

  // Get saved times for the selected date
  const savedTimes =
    value.find((sched) => sched.date === selectedDate)?.times || [];

  // When date changes, update pendingTimes to reflect saved or empty
  React.useEffect(() => {
    if (selectedDate) {
      setPendingTimes(savedTimes);
    }
    // eslint-disable-next-line
  }, [selectedDate, value]);

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
      const isSelected = selectedDate === dateStr;
      const isPast =
        new Date(year, month, day) <
        new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isSaved = value.some((sched) => sched.date === dateStr);
      days.push(
        <button
          key={day}
          type="button"
          className={`relative w-full aspect-square flex items-center justify-center text-xs rounded-full text-center transition
            ${isSelected ? "bg-primary-red text-white" : ""}
            ${
              isPast
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-primary-red hover:text-white"
            }
            m-0 p-0`}
          disabled={disabled || isPast}
          onClick={() => setSelectedDate(dateStr)}
          style={{ minHeight: 0, minWidth: 0, lineHeight: 1 }}
        >
          {day}
          {isSaved && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary-red" />
          )}
        </button>
      );
    }
    return days;
  };

  // Handle time slot toggle for the selected date (local, not saved yet)
  const handleTimeToggle = (time) => {
    setPendingTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  // Save selected times for the selected date
  const handleSaveTimes = () => {
    if (!selectedDate) return;
    let newSchedules = [...value];
    const idx = newSchedules.findIndex((sched) => sched.date === selectedDate);
    if (pendingTimes.length === 0) {
      if (idx !== -1) newSchedules.splice(idx, 1);
    } else if (idx === -1) {
      newSchedules.push({ date: selectedDate, times: pendingTimes });
    } else {
      newSchedules[idx].times = pendingTimes;
    }
    onChange(newSchedules);
  };

  // Remove a saved date
  const handleRemoveDate = (date) => {
    const newSchedules = value.filter((sched) => sched.date !== date);
    onChange(newSchedules);
    if (selectedDate === date) {
      setSelectedDate(null);
      setPendingTimes([]);
    }
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
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 overflow-y-auto mb-2">
                {customTimeSlots.map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    className={`px-4 py-2 rounded-full border text-sm font-semibold text-center transition ${
                      pendingTimes.includes(slot.value)
                        ? "bg-primary-red text-white border-primary-red"
                        : "text-primary-red border-primary-red hover:bg-primary-red hover:text-white"
                    }`}
                    onClick={() => handleTimeToggle(slot.value)}
                    disabled={disabled}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
              
              <button
                className="w-full mt-2 py-2 rounded-full bg-primary-red text-white font-semibold text-sm hover:bg-red-700 transition"
                onClick={handleSaveTimes}
                disabled={disabled || !selectedDate}
              >
                Save Selected Times
              </button>
            </>
          )}
        </div>
      </div>
      {/* Summary of saved times */}
      <div className="border rounded p-2 mt-2">
        <h4 className="font-semibold text-base mb-2 px-4 mt-4 text-primary-red">
          Saved Meet-up Schedules
        </h4>
        {value.length === 0 ? (
          <div className="text-gray-400 text-xs px-2">
            No schedules saved yet.
          </div>
        ) : (
          <div className="flex flex-wrap">
            {(() => {
              // Get simplified schedules for display
              const simplifiedSchedules = simplifyTimeSlots(value);
              return simplifiedSchedules
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((sched) => (
                  <div
                    key={sched.date}
                    className="flex flex-col text-primary-red px-4 py-2 font-semibold text-xs mb-1 w-full"
                    style={{ minWidth: 180 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-primary-red text-xs">
                        {new Date(sched.date).toLocaleDateString()}
                      </span>
                      <button
                        className="ml-2 text-gray-400 hover:text-primary-red"
                        onClick={() => handleRemoveDate(sched.date)}
                        title="Remove all times for this date"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="border-b border-gray-200 mb-2" />
                    <div className="flex flex-wrap gap-1">
                      {sched.times.map((timeRange, index) => {
                        // Convert simplified time range to display label
                        const [startStr, endStr] = timeRange.split('-');
                        const startLabel = customTimeSlots.find((slot) => slot.value.startsWith(startStr))?.label.split(' - ')[0] || startStr.toUpperCase();
                        const endLabel = customTimeSlots.find((slot) => slot.value.endsWith(endStr))?.label.split(' - ')[1] || endStr.toUpperCase();
                        const displayLabel = `${startLabel} - ${endLabel}`;
                        
                        return (
                          <span
                            key={`${sched.date}-${timeRange}-${index}`}
                            className="px-2 py-0.5 rounded-full border border-primary-red bg-primary-red/10 text-primary-red text-[11px] font-medium"
                          >
                            {displayLabel}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
