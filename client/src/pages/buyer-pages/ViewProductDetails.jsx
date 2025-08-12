import { useState, useMemo, useEffect } from 'react';
import {
  MainDashboard,
  PlaceOrder,
  Modal,
  ProductInfoSection,
  SellerInfoSection,
  ReviewsSection,
  MapModal,
  ChatModal,
  ImageCarousel,
} from '../../components';
import { DashboardBackButton } from '../../components/ui';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getListing, getProductReview } from './queries/productDetailsQueries';
import { getUserDetails, getUsersDetails } from '../../queries/index.js';
import { useAuthStore } from '../../store/authStore';
import {
  usePendingOrderCheck,
  useProductDetailsModals,
  useProductDetailsLogic,
} from '../../hooks';
import { formattedUserContact } from '../../utils/formattedUserContact';

export default function ViewProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { currentUser } = useAuthStore();

  // Get listing ID from URL params or fallback to passed state
  const listingId =
    params.id || location.state?.order?.listing_id || location.state?.order?.id;

  const [quantity, setQuantity] = useState(1);

  // Extract modal management to custom hook
  const {
    showPlaceOrder,
    showMapModal,
    showOfferModal,
    showChat,
    offerPrice,
    setOfferPrice,
    offerMessage,
    setOfferMessage,
    customOrder,
    sellerContact,
    openPlaceOrder,
    closePlaceOrder,
    openMapModal,
    closeMapModal,
    openOfferModal,
    closeOfferModal,
    openChat,
    closeChat,
    createCustomOrder,
  } = useProductDetailsModals();

  const {
    data: order = {},
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchOrder,
  } = getListing(listingId);

  const {
    data: sellerProfile = {},
    isLoading: _sellerContactLoading,
    error: _sellerContactError,
  } = getUserDetails(order.seller_id);

  // Add pending order check
  const {
    hasPendingOrder,
    loading: pendingOrderLoading,
    refetch: refetchPendingOrder,
  } = usePendingOrderCheck(listingId);

  // Check if current user is the owner of this listing
  const isOwner = currentUser?.user_id === order.seller_id;

  // Redirect to seller view if user is the owner
  useEffect(() => {
    if (order.seller_id && isOwner) {
      navigate(`/seller/view-product-details/${listingId}`, { replace: true });
    }
  }, [order.seller_id, isOwner, navigate, listingId]);

  const { data: rawReviews = [] } = getProductReview(
    order.seller_id,
    listingId
  );

  const reviewerIDs = useMemo(() => {
    return rawReviews.map((review) => review.user?.userID);
  }, [rawReviews]);

  const userResults = getUsersDetails(reviewerIDs);

  const usersData = userResults.map((result) => result.data);

  const reviews = useMemo(() => {
    if (!rawReviews.length || !usersData.length) return [];

    return rawReviews.map((rawReview, index) => ({
      ...rawReview,
      user: {
        ...rawReview.user,
        name: usersData[index]?.username,
        avatar: usersData[index]?.profile_photo_url,
      },
    }));
  }, [rawReviews, usersData]);

  // Extract business logic to custom hook
  const {
    averageRating,
    handleQuantityChange,
    handlePlaceOrderClick,
    handleOfferConfirm,
  } = useProductDetailsLogic(order, reviews, hasPendingOrder);

  const handleOpenChat = () => {
    console.log('OPEN', order);
    const response = {
      ...formattedUserContact(sellerProfile),
      productID: order.listingId,
      productName: order.productName,
      productImage: order.productImage,
      productPrice:
        order.price_min !== order.price_max
          ? `PHP ${order.price_min} - PHP ${order.price_max}`
          : `PHP ${order.price_max}`,
    };
    console.log('VIEW PRODUCT DETAILS: ', response);
    openChat(response);
  };

  const onQuantityChange = handleQuantityChange(quantity, setQuantity);
  const onPlaceOrderClick = handlePlaceOrderClick(
    hasPendingOrder,
    order,
    openOfferModal,
    openPlaceOrder
  );
  const onOfferConfirm = handleOfferConfirm(
    order,
    offerPrice,
    offerMessage,
    closeOfferModal,
    createCustomOrder,
    openPlaceOrder,
    hasPendingOrder
  );

  if (orderLoading || pendingOrderLoading) {
    return (
      <MainDashboard>
        <div className="w-full flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-red"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </MainDashboard>
    );
  }

  if (orderError) {
    return (
      <MainDashboard>
        <div className="w-full flex justify-center items-center min-h-screen">
          <p className="text-lg text-gray-500">
            {orderError.message || 'No product data found.'}
          </p>
        </div>
      </MainDashboard>
    );
  }

  return (
    <MainDashboard>
      <DashboardBackButton />

      {/* Main Container */}
      <div className="flex flex-col w-[80%] min-h-screen mt-5">
        {/* First Row: Image Carousel + Product Details/User Actions */}
        <div className="flex flex-row gap-12 items-center">
          {/* Left: Image Carousel */}
          <div className="w-1/2">
            <ImageCarousel
              images={order.images || []}
              productName={order.productName || order.name}
            />
          </div>
          {/* Right: Product Details & User Actions */}
          <ProductInfoSection
            order={order}
            quantity={quantity}
            onQuantityChange={onQuantityChange}
            averageRating={averageRating}
            hasPendingOrder={hasPendingOrder}
            pendingOrderLoading={pendingOrderLoading}
            onPlaceOrderClick={onPlaceOrderClick}
          />
        </div>

        {/* Second Row: Reviews + Seller Details */}
        <div className="flex flex-row gap-12 mt-10">
          <ReviewsSection reviews={reviews} order={order} />
          <SellerInfoSection
            order={order}
            onMessageClick={handleOpenChat}
            onMapClick={openMapModal}
          />
        </div>

        {/* PlaceOrder modal */}
        {showPlaceOrder && !hasPendingOrder && (
          <PlaceOrder
            order={customOrder || order}
            currentUser={currentUser}
            quantity={quantity}
            onClose={closePlaceOrder}
            onOrderCreated={() => {
              // Refresh the listing data after order creation
              refetchOrder();
              refetchPendingOrder(); // Refresh pending order status
            }}
          />
        )}
      </div>

      {/* Map Modal */}
      <MapModal isOpen={showMapModal} onClose={closeMapModal} />

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChat}
        onClose={closeChat}
        sellerContact={sellerContact}
      />

      {/* Offer Modal */}
      <Modal
        isOpen={showOfferModal}
        onClose={closeOfferModal}
        title="Make an Offer"
        description={
          <>
            This listing has a flexible price range of{' '}
            <strong>
              ₱{order.priceRange?.min}–₱{order.priceRange?.max}
            </strong>
            .<br />
            The final price may depend on the service details such as size,
            length, time, or workload.
            <br />
            <br />
            Make an offer below and tell the seller what you need so they can
            give you an exact price.
          </>
        }
        type="offer"
        offerPrice={offerPrice}
        setOfferPrice={setOfferPrice}
        offerMessage={offerMessage}
        setOfferMessage={setOfferMessage}
        onConfirm={onOfferConfirm}
      />
    </MainDashboard>
  );
}
