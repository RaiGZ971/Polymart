import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ 
    searchTerm = "", 
    setSearchTerm,
    placeholder = "Got something in mind?",
    ...props 
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(searchTerm);

  const handleChange = (e) => {
    if (setSearchTerm) {
      setSearchTerm(e.target.value);
    }
  };

  const handleFocus = () => setIsFocused(true);
  
  const handleBlur = () => {
    setIsFocused(searchTerm !== "");
  };

  return (
    <div className="flex flex-col w-full items-center font-montserrat">
      {/* Search Bar Container */}
      <div
        className={`border py-3 px-4 rounded-[15px] relative w-full transition-all duration-200 ease-in-out flex items-center ${
          isFocused ? "border-black" : "border-gray-300"
        }`}
      >
        {/* Search Icon */}
        <Search 
          size={16} 
          className="absolute right-4 text-gray-300 pointer-events-none" 
        />

        {/* Search Input */}
        <input
          type="text"
          className="text-black outline-none bg-transparent w-full font-montserrat pl-2 pr-6 text-sm"
          value={searchTerm}
          placeholder={isFocused || hasValue ? "" : placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />

      </div>
    </div>
  );
}