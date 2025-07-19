import { ChevronLeft, ChevronRight } from "lucide-react";

export default function NavigationButtons({
  onPrevStep,
  onNextStep,
  canGoBack,
  canGoForward,
  nextButtonText = "Next"
}) {
  return (
    <div className="w-[60%] flex justify-between mt-20 mb-20">
      <button 
        className={`px-4 py-2 transition-colors duration-200 ${
          !canGoBack
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-600 hover:text-hover-red'
        }`}
        onClick={onPrevStep}
        disabled={!canGoBack}
      >
        <ChevronLeft className="inline" />
        Back
      </button>
      <button 
        className={`px-4 py-2 rounded-[30px] transition-colors duration-200 ${
          !canGoForward
            ? 'bg-white text-gray-500 cursor-not-allowed'
            : 'text-primary-red hover:text-hover-red'
        }`}
        onClick={onNextStep}
        disabled={!canGoForward}
      >
        {nextButtonText}
        <ChevronRight className="inline" />
      </button>
    </div>
  );
}