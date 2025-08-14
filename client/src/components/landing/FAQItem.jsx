import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-4 border-b border-white/20">
      <button
        className="flex justify-between items-center w-full text-left hover:text-[#FFE387]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg text-white">★ {question}</span>
        <ChevronDown
          className={`text-white w-5 h-5 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-white text-base text-left italic pb-2">
          {answer}
        </div>
      </div>
    </div>
  );
}
