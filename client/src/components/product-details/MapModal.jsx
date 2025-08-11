import { pupmap } from '../../assets';
import meetUpLocations from '../../data/meetUpLocations';

export default function MapModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-xl p-10 max-w-2xl w-full relative">
        <button
          className="absolute top-2 right-2 text-primary-red font-bold text-lg"
          onClick={onClose}
          aria-label="Close Map"
        >
          ×
        </button>
        <div className="relative w-full">
          <img
            src={pupmap}
            alt="PUP Map Large"
            className="w-full rounded-2xl h-auto object-contain"
          />
        </div>
        {/* Location mapping below the map */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6">
          {meetUpLocations.slice(0, 6).map((loc, idx) => (
            <div key={loc.value} className="flex items-center gap-2">
              <span className="font-bold text-primary-red">{idx + 1}.</span>
              <span className="text-gray-800">{loc.label}</span>
            </div>
          ))}
          {meetUpLocations.slice(6, 12).map((loc, idx) => (
            <div key={loc.value} className="flex items-center gap-2">
              <span className="font-bold text-primary-red">{idx + 7}.</span>
              <span className="text-gray-800">{loc.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
