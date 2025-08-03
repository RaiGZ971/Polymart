import { useState } from "react";
import { browsableCategories } from "../../data/productCategories.js";

export default function CategoryFilter({
  onCategoryChange,
  initialCategory = "all",
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const handleCategoryClick = (categoryValue) => {
    setActiveCategory(categoryValue);
    if (onCategoryChange) {
      onCategoryChange(categoryValue);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center mt-4">
      {browsableCategories.map((category, index) => (
        <span
          key={index}
          onClick={() => handleCategoryClick(category.value)}
          className={`px-4 py-2 cursor-pointer transition-colors duration-200 text-sm leading-tight ${
            activeCategory === category.value
              ? "text-primary-red font-bold"
              : "text-gray-800 hover:text-primary-red"
          }`}
        >
          {category.label}
        </span>
      ))}
    </div>
  );
}
