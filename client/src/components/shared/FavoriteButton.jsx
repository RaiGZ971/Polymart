import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../../hooks';

export default function FavoriteButton({ 
  listingId, 
  className = "", 
  size = 20,
  showText = false,
  initialFavorited = false
}) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const { toggleFavorite, checkFavoriteStatus } = useFavorites();

  useEffect(() => {
    // Check initial favorite status if not provided
    if (!initialFavorited && listingId) {
      checkInitialStatus();
    }
  }, [listingId, initialFavorited]);

  const checkInitialStatus = async () => {
    try {
      const status = await checkFavoriteStatus(listingId);
      setIsFavorited(status.is_favorited);
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    try {
      setIsLoading(true);
      const response = await toggleFavorite(listingId);
      setIsFavorited(response.is_favorited);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert the state if there was an error
      // Could show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`
        flex items-center gap-1 transition-all duration-200 
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
        ${className}
      `}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        size={size}
        className={`
          transition-colors duration-200
          ${isFavorited 
            ? 'text-red-500 fill-red-500' 
            : 'text-gray-400 hover:text-red-400'
          }
        `}
      />
      {showText && (
        <span className={`text-sm ${isFavorited ? 'text-red-500' : 'text-gray-600'}`}>
          {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
        </span>
      )}
    </button>
  );
}
