import { useState, useEffect } from "react";
import { MainDashboard, ProductCard } from "../../components";
import DashboardBackButton from "../../components/ui/DashboardBackButton";
import { useFavorites } from "../../hooks";
import { Heart, AlertCircle } from "lucide-react";

export default function LikedItems() {
  const { 
    favorites, 
    loading, 
    error, 
    fetchFavorites, 
    removeFavorite 
  } = useFavorites();

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (listingId) => {
    try {
      await removeFavorite(listingId);
    } catch (err) {
      console.error('Error removing favorite:', err);
      // Could show a toast notification here
    }
  };

  // Transform favorites data to match ProductCard expected format
  const transformFavoriteToProductCard = (favorite) => {
    const listing = favorite.listing;
    if (!listing) return null;

    return {
      listingId: listing.listing_id, // Changed from listing_id to listingId
      productImage: listing.images && listing.images.length > 0 
        ? listing.images.find(img => img.is_primary)?.image_url || listing.images[0]?.image_url
        : null,
      productName: listing.name,
      productPrice: listing.price_min,
      priceRange: listing.price_min !== listing.price_max 
        ? { min: listing.price_min, max: listing.price_max }
        : null,
      hasPriceRange: listing.price_min !== listing.price_max,
      username: listing.seller_username,
      userAvatar: listing.seller_profile_photo_url,
      favorited_at: favorite.favorited_at,
      // Add a flag to identify this as a favorite item
      isFavorite: true,
      onRemoveFavorite: () => handleRemoveFavorite(favorite.listing_id)
    };
  };

  if (loading) {
    return (
      <MainDashboard>
        <div className="w-[80%] mt-10 flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-red"></div>
          <p className="mt-4 text-gray-600">Loading your liked items...</p>
        </div>
      </MainDashboard>
    );
  }

  if (error) {
    return (
      <MainDashboard>
        <div className="w-[80%] mt-10 flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Liked Items</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFavorites}
            className="px-6 py-2 bg-primary-red text-white rounded-lg hover:bg-hover-red transition-colors"
          >
            Try Again
          </button>
        </div>
      </MainDashboard>
    );
  }

  return (
    <MainDashboard>
      <DashboardBackButton />
      
      <div className="w-[80%] mt-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary-red fill-current" />
            <h1 className="text-4xl font-bold text-primary-red">Liked Items</h1>
          </div>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <Heart className="h-20 w-20 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Liked Items Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              Start exploring products and click the heart icon to save items you love. 
              They'll appear here for easy access later.
            </p>
            <a
              href="/dashboard"
              className="px-6 py-3 bg-primary-red text-white rounded-lg hover:bg-hover-red transition-colors"
            >
              Browse Products
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {favorites.map((favorite) => {
              const productData = transformFavoriteToProductCard(favorite);
              
              if (!productData) {
                return null;
              }

              return (
                <div key={favorite.listing_id} className="relative">
                  <ProductCard order={productData} />
                  {/* Optional: Add a remove favorite button overlay */}
                  <button
                    onClick={() => handleRemoveFavorite(favorite.listing_id)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors group"
                    title="Remove from liked items"
                  >
                    <Heart className="h-4 w-4 text-primary-red fill-current group-hover:text-red-600" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainDashboard>
  );
}
