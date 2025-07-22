import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const images = [
  "https://picsum.photos/id/1011/400/300",
  "https://picsum.photos/id/1012/400/300",
  "https://picsum.photos/id/1013/400/300",
  "https://picsum.photos/id/1015/400/300",
  "https://picsum.photos/id/1016/400/300",
];

export default function ImageCarousel() {
  const [selected, setSelected] = useState(0);

  const handlePrev = () =>
    setSelected((selected - 1 + images.length) % images.length);
  const handleNext = () => setSelected((selected + 1) % images.length);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <img
          src={images[selected]}
          alt={`Product ${selected + 1}`}
          className="w-full h-[400px] object-cover rounded-xl"
        />
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow hover:bg-gray-100"
          onClick={handlePrev}
        >
          <ChevronLeft size={24} />
        </button>
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow hover:bg-gray-100"
          onClick={handleNext}
        >
          <ChevronRight size={24} />
        </button>
      </div>
      <div className="flex flex-row gap-2">
        {images.map((img, idx) => (
          <img
            key={img}
            src={img}
            alt={`Thumbnail ${idx + 1}`}
            className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 ${selected === idx ? "border-primary-red" : "border-transparent"}`}
            onClick={() => setSelected(idx)}
          />
        ))}
      </div>
    </div>
  );
}
