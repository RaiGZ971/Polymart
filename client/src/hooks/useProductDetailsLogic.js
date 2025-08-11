import { useMemo } from 'react';

export default function useProductDetailsLogic(order, reviews, hasPendingOrder) {
  // Calculate average rating
  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    return Math.round(
      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    );
  }, [reviews]);

  // Handle quantity change with stock validation
  const handleQuantityChange = (quantity, setQuantity) => (val) => {
    const maxStock = order.stock || order.total_stock || 1;
    if (val > maxStock) {
      setQuantity(maxStock);
    } else {
      setQuantity(val);
    }
  };

  // Handle place order click logic
  const handlePlaceOrderClick = (
    hasPendingOrder,
    order,
    openOfferModal,
    openPlaceOrder
  ) => () => {
    if (hasPendingOrder) {
      alert(
        'You already have a pending order for this product. Please wait for the current order to be processed or cancel it before placing a new one.'
      );
      return;
    }

    console.log('Place Order clicked', order.hasPriceRange);
    if (order.hasPriceRange) {
      openOfferModal();
    } else {
      openPlaceOrder();
    }
  };

  // Handle offer confirmation
  const handleOfferConfirm = (
    order,
    offerPrice,
    offerMessage,
    closeOfferModal,
    createCustomOrder,
    openPlaceOrder,
    hasPendingOrder
  ) => () => {
    const min = Number(order.priceRange?.min) || 0;
    const max = Number(order.priceRange?.max) || 0;
    const num = Number(offerPrice);
    
    if (isNaN(num) || offerPrice === '' || num < min || num > max) {
      alert(`Offer price must be between ₱${min} and ₱${max}.`);
      return;
    }

    // Create custom order with offer details
    createCustomOrder(order, num, offerMessage);
    closeOfferModal();

    // Only show place order if no pending order exists
    if (!hasPendingOrder) {
      openPlaceOrder();
    }
  };

  return {
    averageRating,
    handleQuantityChange,
    handlePlaceOrderClick,
    handleOfferConfirm,
  };
}
