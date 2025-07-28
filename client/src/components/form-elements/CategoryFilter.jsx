import { useState } from "react";

export default function CategoryFilter({
  onCategoryChange,
  initialCategory = "all",
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const categories = [
    { name: "All Categories", value: "all" },
    { name: "Academic Essentials", value: "academic" },
    { name: "Creative Works", value: "creative" },
    { name: "Services", value: "services" },
    { name: "Tech & Gadgets", value: "technology" },
    { name: "Fashion", value: "fashion" },
    { name: "Anik-Anik", value: "anik" },
    { name: "Other", value: "other" },
  ];

  const handleCategoryClick = (categoryValue) => {
    setActiveCategory(categoryValue);
    if (onCategoryChange) {
      onCategoryChange(categoryValue);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center mt-4">
      {categories.map((category, index) => (
        <span
          key={index}
          onClick={() => handleCategoryClick(category.value)}
          className={`px-4 py-2 cursor-pointer transition-colors duration-200 text-sm leading-tight ${
            activeCategory === category.value
              ? "text-primary-red font-bold"
              : "text-gray-800 hover:text-primary-red"
          }`}
        >
          {category.name}
        </span>
      ))}
    </div>
  );
}
