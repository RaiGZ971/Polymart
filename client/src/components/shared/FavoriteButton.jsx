import { Heart } from 'lucide-react';
import { useFavoriteStatus, useToggleFavorite } from '../../hooks/queries/useFavoritesQueries';
import { useState } from 'react';

export default function FavoriteButton({ 
  listingId, 
  className = "", 
  size = 20,
  showText = false,
  initialFavorited = false
}) {
  // Use TanStack Query for optimized caching and background updates
  const { data: isFavorited = initialFavorited, isLoading } = useFavoriteStatus(listingId);
  const toggleFavoriteMutation = useToggleFavorite();
  const [error, setError] = useState(null);

  // Debug log to see what's happening with the favorite status
  console.log(`FavoriteButton ${listingId}:`, { isFavorited, isLoading, initialFavorited });

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || toggleFavoriteMutation.isPending) return;

    console.log('Toggling favorite for listing:', listingId, 'Current state:', isFavorited);

    try {
      setError(null);
      const result = await toggleFavoriteMutation.mutateAsync(listingId);
      console.log('Toggle favorite result:', result);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      
      // Handle specific error cases
      if (err.message?.includes('cannot favorite your own listing')) {
        setError('You cannot favorite your own listing');
      } else if (err.message?.includes('400')) {
        setError('Cannot favorite this listing');
      } else {
        setError('Failed to update favorite status');
      }
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  const isProcessing = isLoading || toggleFavoriteMutation.isPending;

  return (
    <div className="relative">
      <button
        onClick={handleToggleFavorite}
        disabled={isProcessing}
        className={`
          flex items-center gap-1 transition-all duration-200 
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
          ${className}
        `}
        title={
          error ? error : 
          isFavorited ? 'Remove from favorites' : 'Add to favorites'
        }
      >
        <Heart
          size={size}
          className={`
            transition-colors duration-200
            ${isFavorited 
              ? 'text-red-500 fill-red-500' 
              : 'text-gray-400 hover:text-red-400'
            }
            ${error ? 'text-red-300' : ''}
          `}
        />
        {showText && (
          <span className={`text-sm ${isFavorited ? 'text-red-500' : 'text-gray-600'}`}>
            {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
          </span>
        )}
      </button>
      
      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  );
}
