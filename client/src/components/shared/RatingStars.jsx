import { useState, useRef } from "react";

const STAR_COUNT = 5;

export default function RatingStars({ value = 0, onChange }) {
  const [hoverValue, setHoverValue] = useState(null);
  const containerRef = useRef(null);

  // Calculate the value based on mouse position
  const getValueFromPosition = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    // Only full star increments
    return Math.ceil(percent * STAR_COUNT);
  };

  const handleMouseMove = (e) => {
    setHoverValue(getValueFromPosition(e));
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const handleClick = (e) => {
    const newValue = getValueFromPosition(e);
    if (onChange) onChange(newValue);
  };

  // Which value to display (hover or actual)
  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div
      ref={containerRef}
      className="flex cursor-pointer select-none w-[120px] h-6"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      aria-label="Rating"
      role="slider"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={5}
      tabIndex={0}
    >
      {[...Array(STAR_COUNT)].map((_, i) => {
        const starValue = i + 1;
        const isActive = displayValue >= starValue;
        return (
          <span
            key={i}
            className={`inline-block text-center align-middle w-6 h-6 text-2xl transition-colors ${
              isActive ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            {isActive ? "★" : "☆"}
          </span>
        );
      })}
    </div>
  );
}
