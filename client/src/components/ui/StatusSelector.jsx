import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const StatusSelector = ({ currentStatus, onStatusChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Status options - sold_out is display-only (system generated)
  const statusOptions = [
    { 
      value: 'active', 
      label: 'Active', 
      description: 'Visible to buyers and available for purchase',
      color: 'bg-green-100 text-green-700 border-green-200',
      selectable: true
    },
    { 
      value: 'inactive', 
      label: 'Inactive', 
      description: 'Hidden from buyers but not deleted',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      selectable: true
    },
    { 
      value: 'archived', 
      label: 'Archived', 
      description: 'Permanently hidden and no longer available',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      selectable: true
    },
    { 
      value: 'sold_out', 
      label: 'Sold Out', 
      description: 'All inventory sold',
      color: 'bg-red-100 text-red-700 border-red-200',
      selectable: false
    }
  ];

  const currentOption = statusOptions.find(option => option.value === currentStatus);

  const handleStatusSelect = (newStatus, option) => {
    // Don't allow selection of non-selectable options
    if (!option.selectable) {
      return;
    }
    
    if (newStatus !== currentStatus && !disabled) {
      onStatusChange(newStatus);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full px-4 py-2 text-left border rounded-lg
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
          ${currentOption?.color || 'bg-gray-100 text-gray-700 border-gray-200'}
        `}
      >
        <div className="flex flex-col">
          <span className="font-medium">{currentOption?.label || 'Unknown'}</span>
          <span className="text-xs opacity-75">{currentOption?.description}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusSelect(option.value, option)}
              disabled={!option.selectable}
              className={`
                w-full px-4 py-3 text-left first:rounded-t-lg last:rounded-b-lg
                flex items-center justify-between group
                ${option.value === currentStatus ? 'bg-blue-50' : ''}
                ${option.selectable 
                  ? 'hover:bg-gray-50 cursor-pointer' 
                  : 'cursor-not-allowed opacity-60 bg-gray-25'
                }
              `}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{option.label}</span>
                  {!option.selectable && (
                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                      System Generated
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{option.description}</span>
              </div>
              {option.value === currentStatus && (
                <Check size={16} className="text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusSelector;
