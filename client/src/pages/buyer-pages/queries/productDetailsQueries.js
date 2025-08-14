import { formattedReviews, formattedListing } from '../../../utils/index.js';
import { ListingService, ReviewService } from '../../../services/index.js';
import { useQuery } from '@tanstack/react-query';

export const getProductReview = (revieweeID, productID) => {
  return useQuery({
    queryKey: ['review', revieweeID, productID],
    queryFn: () => ReviewService.getProductReview(revieweeID, productID),
    enabled: !!revieweeID && !!productID,
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      return formattedReviews(data);
    },
  });
};

export const getListing = (listingID) => {
  return useQuery({
    queryKey: ['product', listingID],
    queryFn: () => ListingService.getListingById(listingID),
    enabled: !!listingID,
    staleTime: 1 * 60 * 1000,
    select: (data) => {
      return formattedListing(data);
    },
  });
};
