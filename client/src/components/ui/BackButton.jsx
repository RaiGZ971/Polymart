import Button from "./Button";
import { ChevronLeft } from "lucide-react";

export default function BackButton({
  onClick,
  className = "",
  children = "Back",
}) {
  return (
    <Button
      variant="back"
      className={`group flex items-center w-fit px-0 py-0 bg-transparent shadow-none ${className}`}
      onClick={onClick}
    >
      <ChevronLeft
        size={24}
        className="text-gray-400 group-hover:text-primary-red"
      />
      <span className="ml-2 text-gray-400 group-hover:text-primary-red">
        {children}
      </span>
    </Button>
  );
}
