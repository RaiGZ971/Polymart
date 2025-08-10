import { MoreVertical, ShoppingBag } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import FavoriteButton from "../shared/FavoriteButton";

export default function ProductCard({ order }) {
  const {
    productImage,
    productName,
    productPrice,
    priceRange,
    hasPriceRange,
    username,
    itemsOrdered = 0,
    userAvatar,
    listingId, // Add this for the favorite functionality
    isFavorited, // Pre-fetched favorite status from batch query
    isOwner, // Whether the current user owns this listing
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

  // Handle missing data gracefully
  const displayImage = productImage || 'https://via.placeholder.com/268x245?text=No+Image';
  const displayName = productName || 'Untitled Product';
  const displayUsername = username || 'Unknown User';
  const displayAvatar = userAvatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNUMxNy43OTA5IDI1IDE2IDIzLjIwOTEgMTYgMjFDMTYgMTguNzkwOSAxNy43OTA5IDE3IDIwIDE3QzIyLjIwOTEgMTcgMjQgMTguNzkwOSAyNCAyMUMyNCAyMy4yMDkxIDIyLjIwOTEgMjUgMjAgMjVaIiBmaWxsPSIjOUI5QkE5Ii8+CjxwYXRoIGQ9Ik0yOCAzMEMyOCAyNi42ODYzIDI0LjQxODMgMjQgMjAgMjRDMTUuNTgxNyAyNCAxMiAyNi42ODYzIDEyIDMwSDI4WiIgZmlsbD0iIzlCOUJBOSIvPgo8L3N2Zz4K';

  return (
    <div
      className="w-full h-full bg-white rounded-2xl shadow-md hover:shadow-glow hover:scale-[102%] hover:shadow-gray-400 transition-all duration-200 relative flex flex-col overflow-hidden"
      style={{ minWidth: 247, minHeight: 346 }}
    >
      {/* Image */}
      <div className="relative w-full h-[245px]">
        <img
          src={displayImage}
          alt={displayName}
          className="w-full h-full object-cover rounded-t-2xl"
        />
        {/* Top right icons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          {/* Only show favorite button if user doesn't own this listing */}
          {!isOwner && (
            <FavoriteButton 
              listingId={listingId}
              className="bg-white rounded-full p-1 shadow hover:text-[#950000] transition-colors"
              size={20}
              initialFavorited={isFavorited}
            />
          )}
          {/* Show status badge for owner, 3-dot menu for others */}
          {isOwner ? (
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              order.status === 'active' ? 'bg-green-100 text-green-700' :
              order.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
              order.status === 'archived' ? 'bg-gray-100 text-gray-700' :
              order.status === 'sold_out' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {order.status || 'active'}
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                className={`bg-white rounded-full p-1 shadow hover:text-[#950000] transition-colors ${
                  dropdownOpen ? "text-[#950000]" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((v) => !v);
                }}
              >
                <MoreVertical size={20} />
              </button>
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Buyer-specific menu items */}
                  <button className="block w-full text-left px-4 py-2 text-sm hover:bg-[#950000]/10 hover:text-[#950000] transition-colors">
                    Report listing
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-sm hover:bg-[#950000]/10 hover:text-[#950000] transition-colors">
                    Share
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Card Content */}
      <div className="flex flex-col flex-1 justify-between px-4 py-3">
        <div className="text-left">
          <div className="text-[13px] font-medium text-gray-900 truncate leading-tight">
            {displayName}
          </div>
          <div className="text-[18px] font-bold text-primary-red leading-tight">
            {hasPriceRange && priceRange
              ? `PHP ${priceRange.min} - PHP ${priceRange.max}`
              : `PHP ${productPrice || 0}`}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={displayAvatar}
              alt={displayUsername}
              className="rounded-full object-cover flex-shrink-0 w-[18px] h-[18px]"
            />
            <span className="text-xs text-gray-400 truncate">{displayUsername}</span>
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
