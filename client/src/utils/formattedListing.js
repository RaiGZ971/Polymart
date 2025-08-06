export const formattedListing = (listing) => {
  const hasRange =
    listing.price_min !== null &&
    listing.price_max !== null &&
    listing.price_min !== listing.price_max;

  const transformedOrder = {
    ...listing,
    id: listing.listing_id,
    productName: listing.name,
    productPrice: listing.price_min,
    priceRange: hasRange
      ? {
          min: listing.price_min,
          max: listing.price_max,
        }
      : null,
    hasPriceRange: hasRange,
    username: listing.user_profile?.username || listing.seller_username,
    userAvatar:
      listing.seller_profile_photo_url ||
      'https://via.placeholder.com/40x40?text=User',
    productImage:
      listing.images && listing.images.length > 0
        ? listing.images.find((img) => img.is_primary)?.image_url ||
          listing.images[0].image_url
        : 'https://via.placeholder.com/268x245?text=No+Image',
    images: listing.images || [],
    itemsOrdered: listing.sold_count || 0,
    category: listing.category,
    productDescription: listing.description,
    status: listing.status,
    created_at: listing.created_at,
    tags: listing.tags,
    stock: listing.total_stock,
    meetupLocations: listing.seller_meetup_locations || [],
    paymentMethods: listing.payment_methods || [],
  };

  return transformedOrder;
};
