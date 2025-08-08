import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function DashboardBackButton({ 
  text = 'Back to Dashboard',
  className = 'w-[80%] mt-10 flex cursor-pointer select-none'
}) {
  const navigate = useNavigate();

  return (
    <div
      className={className}
      onClick={() => navigate('/dashboard')}
    >
      <ChevronLeft size={24} className="text-primary-red" />
      <span className="ml-2 text-primary-red font-semibold hover:underline">
        {text}
      </span>
    </div>
  );
}
