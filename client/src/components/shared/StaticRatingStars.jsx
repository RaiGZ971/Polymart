import React from "react";

const STAR_COUNT = 5;

export default function StaticRatingStars({ value = 0 }) {
  return (
    <div
      className="flex w-[120px] h-6"
      aria-label={`Rating: ${value} out of 5`}
    >
      {[...Array(STAR_COUNT)].map((_, i) => {
        const starValue = i + 1;
        const isActive = value >= starValue;
        return (
          <span
            key={i}
            className={`inline-block text-center align-middle w-6 h-6 text-2xl ${
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
