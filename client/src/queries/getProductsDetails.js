import { useQueries, useQuery } from '@tanstack/react-query';
import { ListingService } from '../services/listingService.js';

export const getProductsDetails = (productIDs) => {
  return useQueries({
    queries: productIDs.map((productID) => ({
      queryKey: ['product', productID],
      queryFn: () => ListingService.getListingById(productID),
      enabled: !!productIDs.length > 0,
      staleTime: 5 * 60 * 1000,
    })),
  });
};
