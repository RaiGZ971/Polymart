import { useState, useRef } from "react";

const STAR_COUNT = 5;

export default function RatingStars({
  value = 0,
  onChange,
  size = "default", // "default" or "large"
}) {
  const [hoverValue, setHoverValue] = useState(null);
  const containerRef = useRef(null);

  // Size configurations
  const sizeConfig = {
    default: {
      containerClass: "flex justify-center items-center gap-1",
      starClass: "w-6 h-6 text-2xl cursor-pointer",
    },
    large: {
      containerClass: "flex justify-center items-center gap-2",
      starClass: "w-12 h-12 text-5xl cursor-pointer",
    },
  };

  const config = sizeConfig[size] || sizeConfig.default;

  const handleStarClick = (starIndex) => {
    const newValue = starIndex + 1;
    if (onChange) onChange(newValue);
  };

  const handleStarHover = (starIndex) => {
    setHoverValue(starIndex + 1);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  // Which value to display (hover or actual)
  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div
      ref={containerRef}
      className={config.containerClass}
      onMouseLeave={handleMouseLeave}
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
            className={`inline-block text-center ${config.starClass} transition-colors ${
              isActive ? "text-yellow-400" : "text-gray-300"
            }`}
            onClick={() => handleStarClick(i)}
            onMouseEnter={() => handleStarHover(i)}
          >
            {isActive ? "★" : "☆"}
          </span>
        );
      })}
    </div>
  );
}
