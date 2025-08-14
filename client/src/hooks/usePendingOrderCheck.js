import { useState, useEffect } from 'react';
import { OrderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';

export const usePendingOrderCheck = (listingId) => {
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuthStore();

  const checkPendingOrder = async () => {
    if (!listingId || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await OrderService.checkPendingOrder(listingId);
      setHasPendingOrder(response.has_pending_order);
      
    } catch (err) {
      console.error('Error checking pending order:', err);
      setError(err.message);
      setHasPendingOrder(false); // Default to allowing orders on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPendingOrder();
  }, [listingId, token]);

  const refetch = () => {
    if (listingId && token) {
      checkPendingOrder();
    }
  };

  return { hasPendingOrder, loading, error, refetch };
};
