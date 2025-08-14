import Button from "./Button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function BackButton({
  onClick,
  to,
  className = "",
  children = "Back",
  variant = "back",
  size = 24,
}) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1); // Default back behavior
    }
  };

  return (
    <Button
      variant={variant}
      className={`group flex items-center w-fit px-0 py-0 bg-transparent shadow-none ${className}`}
      onClick={handleClick}
    >
      <ChevronLeft
        size={size}
        className="text-gray-400 group-hover:text-primary-red"
      />
      <span className="ml-2 text-gray-400 group-hover:text-primary-red">
        {children}
      </span>
    </Button>
  );
}
