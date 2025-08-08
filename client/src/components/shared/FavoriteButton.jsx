import { Heart } from 'lucide-react';
import { useFavoriteStatus, useToggleFavorite } from '../../hooks/queries/useFavoritesQueries';

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

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || toggleFavoriteMutation.isPending) return;

    try {
      await toggleFavoriteMutation.mutateAsync(listingId);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // TanStack Query will handle reverting optimistic updates on error
    }
  };

  const isProcessing = isLoading || toggleFavoriteMutation.isPending;

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isProcessing}
      className={`
        flex items-center gap-1 transition-all duration-200 
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
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
