import { useState, useEffect } from 'react';
import { OrderService, UserService } from '../services';

export const useOrdersData = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await OrderService.getUserOrders({
        page: 1,
        page_size: 100 // Get all orders
      });

      const ordersData = response.orders || [];
      const currentUser = UserService.getCurrentUser();
      
      // Transform orders to match the expected format
      const transformedOrders = ordersData.map(transformOrderToComponent);
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Transform API order data to match the expected format for OrdersListingsComponent
  const transformOrderToComponent = (order) => {
    const currentUser = UserService.getCurrentUser();
    const isUserBuyer = order.buyer_id === currentUser?.user_id;
    
    return {
      id: order.order_id,
      role: isUserBuyer ? "user" : "owner", // user = buyer, owner = seller
      status: order.status,
      location: order.meetup?.location || "TBD",
      product: order.listing?.name || "Unknown Product",
      date: order.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      productName: order.listing?.name || "Unknown Product",
      productImage: order.listing?.images?.[0] || 'https://via.placeholder.com/201x101?text=No+Image',
      productPrice: order.price_at_purchase || order.listing?.price_min || 0,
      itemsOrdered: order.quantity || 1,
      username: isUserBuyer 
        ? (order.seller_profile?.username || order.seller_profile?.full_name || "Unknown Seller")
        : (order.buyer_profile?.username || order.buyer_profile?.full_name || "Unknown Buyer"),
      userAvatar: isUserBuyer 
        ? (order.seller_profile?.profile_photo || 'https://via.placeholder.com/40x40?text=S')
        : (order.buyer_profile?.profile_photo || 'https://via.placeholder.com/40x40?text=B'),
      paymentMethod: order.payment_method || "Unknown",
      schedule: order.meetup?.scheduled_at || "TBD",
      remark: order.meetup?.remarks || "",
      
      // Additional fields that might be needed
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      listing_id: order.listing_id,
      transaction_method: order.transaction_method,
      meetup: order.meetup,
      
      // Products ordered (simplified for now - could be expanded)
      productsOrdered: [
        {
          name: order.listing?.name || "Unknown Product",
          image: order.listing?.images?.[0] || 'https://via.placeholder.com/201x101?text=No+Image',
          price: order.price_at_purchase || order.listing?.price_min || 0,
          quantity: order.quantity || 1,
        }
      ],
    };
  };

  // Filter orders based on criteria
  const getFilteredOrders = (status = 'all', location = 'all', activeTab = 'orders') => {
    let filtered = [...orders];

    // Filter by tab (role)
    if (activeTab === 'orders') {
      filtered = filtered.filter(order => order.role === 'user'); // User is buyer
    } else if (activeTab === 'listings') {
      filtered = filtered.filter(order => order.role === 'owner'); // User is seller
    }

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === status.toLowerCase()
      );
    }

    // Filter by location
    if (location !== 'all') {
      filtered = filtered.filter(order => 
        order.location?.toLowerCase() === location.toLowerCase()
      );
    }

    return filtered;
  };

  // Get counts for tabs
  const getCounts = () => {
    const userOrders = orders.filter(order => order.role === 'user').length;
    const sellerOrders = orders.filter(order => order.role === 'owner').length;
    
    return {
      yourOrdersCount: userOrders,
      listingsCount: sellerOrders
    };
  };

  // Refresh data
  const refreshData = () => {
    fetchOrders();
  };

  // Load data on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    getFilteredOrders,
    getCounts,
    refreshData
  };
};
