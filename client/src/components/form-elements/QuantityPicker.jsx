import { useState } from "react";

export default function QuantityPicker({ min = 1, max = 99, value, onChange }) {
  const [quantity, setQuantity] = useState(value || min);

  const handleChange = (val) => {
    let newVal = parseInt(val, 10);
    if (isNaN(newVal)) newVal = min;
    if (newVal < min) newVal = min;
    if (newVal > max) newVal = max;
    setQuantity(newVal);
    if (onChange) onChange(newVal);
  };

  const handleInput = (e) => {
    handleChange(e.target.value);
  };

  const handleDecrement = () => {
    if (quantity > min) handleChange(quantity - 1);
  };

  const handleIncrement = () => {
    if (quantity < max) handleChange(quantity + 1);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="px-3 py-1 border-gray-300 border-1 rounded-full bg-gray-100 shadow-light hover:bg-gray-200 text-xs font-bold"
        onClick={handleDecrement}
        disabled={quantity <= min}
      >
        -
      </button>
      <input
        type="number"
        className="w-16 text-center border rounded-full"
        value={quantity}
        min={min}
        max={max}
        onChange={handleInput}
      />
      <button
        type="button"
        className="px-3 py-1 border-gray-300 border-1 rounded-full bg-gray-100 shadow-light hover:bg-gray-200 text-xs font-bold"
        onClick={handleIncrement}
        disabled={quantity >= max}
      >
        +
      </button>
    </div>
  );
}
