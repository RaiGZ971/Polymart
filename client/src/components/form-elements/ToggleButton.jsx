export default function ToggleButton ({ label, onClick, isActive }) {
    return (
        <button
            className={`px-4 py-1 border text-xs font-semibold rounded-full transition duration-200 ${
                isActive 
                    ? 'bg-primary-red text-white border-primary-red' 
                    : 'border-gray-400 text-gray-500 hover:bg-primary-red hover:text-white hover:border-primary-red'
            }`}
            onClick={onClick}
        >
            {label}
        </button>
    );
};