import { Heart, MoreVertical, ShoppingBag } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function ProductCard({ order }) {
  const {
    productImage = "https://picsum.photos/247/245",
    productName = "Crocheted Photocard Holder",
    productPrice = 300,
    username = "backburnerngbayan",
    itemsOrdered = 5,
    userAvatar = "https://picsum.photos/18/18",
  } = order || {};

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="w-[268px] h-[346px] bg-white rounded-2xl shadow-md hover:shadow-glow hover:scale-[102%] hover:shadow-gray-400 transition-all duration-200 relative flex flex-col overflow-hidden"
      style={{ minWidth: 247, minHeight: 346 }}
    >
      {/* Image */}
      <div className="relative w-full h-[245px]">
        <img
          src={productImage}
          alt={productName}
          className="w-full h-full object-cover rounded-t-2xl"
        />
        {/* Top right icons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button className="bg-white rounded-full p-1 shadow hover:text-[#950000] transition-colors">
            <Heart size={20} />
          </button>
          <button className="bg-white rounded-full p-1 shadow hover:text-[#950000] transition-colors">
            <ShoppingBag size={20} />
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              className={`bg-white rounded-full p-1 shadow hover:text-[#950000] transition-colors ${dropdownOpen ? "text-[#950000]" : ""}`}
              onClick={() => setDropdownOpen((v) => !v)}
            >
              <MoreVertical size={20} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <button className="block w-full text-left px-4 py-2 text-sm hover:bg-[#950000]/10 hover:text-[#950000] transition-colors">
                  Report listing
                </button>
                <button className="block w-full text-left px-4 py-2 text-sm hover:bg-[#950000]/10 hover:text-[#950000] transition-colors">
                  Share
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Card Content */}
      <div className="flex flex-col flex-1 justify-between px-4 py-3">
        <div className="text-left">
          <div className="text-[13px] font-medium text-gray-900 truncate leading-tight">
            {productName}
          </div>
          <div className="text-[18px] font-bold text-primary-red leading-tight">
            PHP {productPrice}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={userAvatar}
              alt={username}
              className="rounded-full object-cover flex-shrink-0 w-[18px] h-[18px]"
            />
            <span className="text-xs text-gray-400 truncate">{username}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {itemsOrdered} items ordered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example usage elsewhere in your app:
// {ordersSampleData.map((order, idx) => (
//   <ProductCard key={idx} order={order}
