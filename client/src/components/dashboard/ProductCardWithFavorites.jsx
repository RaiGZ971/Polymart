import { useMemo } from 'react';
import { useBatchFavoriteStatus } from '../../hooks/queries/useFavoritesQueries';
import ProductCard from './ProductCard';

/**
 * Enhanced ProductCard that uses batched favorite status checks
 * to reduce API calls when rendering multiple product cards
 */
export default function ProductCardWithFavorites({ order, batchFavorites = {} }) {
  const listingId = order?.listingId || order?.listing_id || order?.id;
  const isFavorited = batchFavorites[listingId] || false;

  // Pass the batched favorite status to the original ProductCard
  const enhancedOrder = useMemo(() => ({
    ...order,
    isFavorited,
  }), [order, isFavorited]);

  return <ProductCard order={enhancedOrder} />;
}

/**
 * Wrapper component that batches favorite status checks for multiple product cards
 */
export function ProductGrid({ orders = [], ...props }) {
  // Extract all listing IDs from orders
  const listingIds = useMemo(() => {
    return orders
      .map(order => order?.listingId || order?.listing_id || order?.id)
      .filter(Boolean);
  }, [orders]);

  // Batch fetch all favorite statuses at once
  const { data: batchFavorites = {}, isLoading } = useBatchFavoriteStatus(listingIds);

  // If still loading, show loading cards or regular cards without favorite status
  if (isLoading) {
    return (
      <div className={props.className}>
        {orders.map((order, idx) => (
          <ProductCard key={order?.listingId || order?.listing_id || order?.id || idx} order={order} />
        ))}
      </div>
    );
  }

  return (
    <div className={props.className}>
      {orders.map((order, idx) => (
        <ProductCardWithFavorites 
          key={order?.listingId || order?.listing_id || order?.id || idx} 
          order={order}
          batchFavorites={batchFavorites}
        />
      ))}
    </div>
  );
}
