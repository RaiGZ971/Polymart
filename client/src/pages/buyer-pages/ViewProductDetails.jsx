import { useState, useMemo, useEffect } from 'react';
import {
  MainDashboard,
  PlaceOrder,
  QuantityPicker,
  GrayTag,
  CalendarViewer,
  StaticRatingStars,
  ImageCarousel,
  ReviewComponent,
  ChatApp,
  Modal,
  FavoriteButton,
} from '../../components';
import { DashboardBackButton } from '../../components/ui';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Flag, ShoppingBag } from 'lucide-react';
import productCategories from '../../data/productCategories';
import { stallbanner, pupmap } from '../../assets';
import meetUpLocations from '../../data/meetUpLocations';
import timeSlots from '../../data/timeSlots';
import { getListing, getProductReview } from './queries/productDetailsQueries';
import { getUsersDetails } from '../../queries/index.js';
import { useAuthStore } from '../../store/authStore';

const getCategoryLabel = (value) => {
  const found = productCategories.find((cat) => cat.value === value);
  return found ? found.label : value;
};

// Helper to generate value for CalendarViewer from order.availableSchedules
function getCalendarValue(order) {
  // Handle both snake_case (from API) and camelCase (from sample data)
  const schedules = order?.available_schedules || order?.availableSchedules;
  if (!schedules) return [];
  return schedules.flatMap((sched) =>
    (sched.times || []).map((time) => [sched.date, time])
  );
}

export default function ViewProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { currentUser } = useAuthStore();

  // Get listing ID from URL params or fallback to passed state
  const listingId =
    params.id || location.state?.order?.listing_id || location.state?.order?.id;

  const [quantity, setQuantity] = useState(1);
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [customOrder, setCustomOrder] = useState(null);

  const {
    data: order = {},
    isLoading: orderLoading,
    error: orderError,
  } = getListing(listingId);

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

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    return Math.round(
      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    );
  }, [reviews]);

  if (orderLoading) {
    return (
      <MainDashboard>
        <div className="w-full flex justify-center items-center min-h-screen">
          <p className="text-lg text-gray-500">Loading product details...</p>
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
          <div className="w-1/2 text-left space-y-5">
            <div className="flex flex-col gap-2">
              {/* Title & Category */}
              <div>
                <div className="flex flex-row justify-between">
                  <p className="text-primary-red text-base">
                    {getCategoryLabel(order.category)}
                  </p>
                  <button className="text-sm group hover:text-primary-red hover:underline">
                    <Flag
                      size={20}
                      className="inline pr-1 group-hover:text-primary-red"
                    />
                    Report
                  </button>
                </div>
                <h1 className="text-4xl flex flex-wrap font-bold">
                  {order.productName || order.name}
                </h1>
              </div>
              {/* Price & Average Rating */}
              <div className="flex flex-row items-center justify-between">
                <h2 className="text-3xl font-bold text-primary-red">
                  {order.hasPriceRange && order.priceRange
                    ? `PHP ${order.priceRange.min} - PHP ${order.priceRange.max}`
                    : `PHP ${order.productPrice}`}
                </h2>
                <div className="flex flex-col items-end">
                  <StaticRatingStars value={averageRating} />
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">
                    {averageRating} stars |{' '}
                    {order.sold_count || order.itemsOrdered || 0} reviews
                  </p>
                </div>
              </div>
              {/* Product Description */}
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold text-primary-red">
                  Product Description
                </p>
                <p className="text-sm text-gray-800">
                  {order.productDescription ||
                    order.description ||
                    'No description provided.'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {/* User Actions */}
              <div className="flex flex-row gap-1 text-base">
                <p className="font-semibold text-primary-red">Availability:</p>
                <p className=" text-gray-800">
                  {order.stock || order.total_stock || 0} in stock
                </p>
              </div>
              <div className="flex flex-row gap-2 text-base">
                <p className="font-semibold text-primary-red">
                  Item Quantity:{' '}
                </p>
                <QuantityPicker
                  value={quantity}
                  min={1}
                  max={order.stock || order.total_stock || 1}
                  onChange={(val) => {
                    if (val > (order.stock || order.total_stock || 1)) {
                      setQuantity(order.stock || order.total_stock || 1);
                    } else {
                      setQuantity(val);
                    }
                  }}
                />
              </div>
            </div>
            {/* Place Order Button */}
            <button
              className="hover:bg-primary-red hover:text-white px-4 py-2 rounded-full bg-white border-2 
                  border-primary-red transition-colors text-primary-red font-bold w-full"
              onClick={() => {
                console.log('Place Order clicked', order.hasPriceRange);
                if (order.hasPriceRange) {
                  setShowOfferModal(true);
                } else {
                  setShowPlaceOrder(true);
                }
              }}
            >
              Place Order
            </button>

            <div className="flex flex-row gap-4 items-center">
              <FavoriteButton 
                listingId={order.listing_id || order.id}
                className="text-sm group hover:text-primary-red hover:underline"
                size={20}
                showText={true}
              />
              {/* User Actions End */}
            </div>
          </div>
        </div>
        {/* Second Row: Reviews + Seller Details */}
        <div className="flex flex-row gap-12 mt-10">
          {/* Left: Reviews */}
          <div className="w-1/2">
            <div className="flex flex-row items-end justify-between">
              <h1 className="font-bold text-3xl text-primary-red text-left">
                Reviews:
              </h1>
              <p className="text-gray-500 text-sm">
                {reviews ? reviews.length : 0} reviews |{' '}
                {order.sold_count || order.itemsOrdered || 0} items sold
              </p>
            </div>

            {/* Review Section */}
            <div className="mt-4 space-y-4">
              {reviews && reviews.length > 0 ? (
                <>
                  {(showAllReviews ? reviews : reviews.slice(0, 5)).map(
                    (review, idx) => (
                      <ReviewComponent key={idx} review={review} />
                    )
                  )}
                  {!showAllReviews && reviews.length > 5 && (
                    <button
                      className="text-primary-red font-semibold hover:underline mt-2"
                      onClick={() => setShowAllReviews(true)}
                    >
                      See All
                    </button>
                  )}
                </>
              ) : (
                <p className="text-gray-500">No reviews yet.</p>
              )}
            </div>
          </div>
          {/* Right: Seller Details */}
          <div className="w-1/2">
            {/* Seller */}
            <div className="flex flex-row items-start justify-between">
              <div className="flex flex-row items-center gap-4">
                <div className="relative flex flex-col items-center w-20 h-20">
                  {/* Stall Banner Overlay */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-12 overflow-hidden z-10 flex justify-center">
                    <img
                      src={stallbanner}
                      alt="Stall Banner"
                      className="w-full h-full object-cover"
                      style={{ pointerEvents: 'none' }}
                    />
                  </div>
                  {/* User Image */}
                  <img
                    src={order.userAvatar || "https://picsum.photos/247/245"}
                    alt="User Image"
                    className="w-full h-full rounded-full object-cover z-0"
                  />
                </div>
                <div className="text-left pl-3">
                  <p className="font-bold text-lg">{order.username || 'Unknown Seller'}</p>
                  <p className="text-gray-500 text-sm">PUP Sta Mesa | CCIS</p>
                  <p className="text-xs text-gray-800 mt-2">
                    {order.seller_listing_count || 0} Listings | <span className="text-yellow-400">★</span> 4.5 stars
                  </p>
                </div>
              </div>
              <div>
                <button
                  className="bg-primary-red font-semibold text-white px-4 py-2 rounded-lg hover:bg-hover-red transition-colors text-sm"
                  onClick={() => setShowChat(true)}
                >
                  Message
                </button>
              </div>
            </div>
            {/* Map */}
            <div className="flex flex-col text-left mt-10">
              <h1 className="text-2xl font-bold text-primary-red">
                Meet Up Details
              </h1>
              <button
                className="focus:outline-none"
                onClick={() => setShowMapModal(true)}
                aria-label="View PUP Map"
              >
                <img
                  src={pupmap}
                  alt="PUP Map"
                  className="w-full h-full rounded-2xl object-cover mt-4 hover:brightness-90 transition"
                />
              </button>
            </div>
            {/* Meet Up Locations */}
            <div className="flex flex-col text-left mt-10">
              <h1 className="text-primary-red font-semibold text-base">
                Available Meet Up Locations
              </h1>
              <p className="text-sm text-gray-500">
                Seller’s available meet-up locations are listed below
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {order.meetupLocations || order.seller_meetup_locations ? (
                  (order.meetupLocations || order.seller_meetup_locations).map(
                    (loc, idx) => <GrayTag key={idx} text={loc} />
                  )
                ) : (
                  <GrayTag text="No locations listed" />
                )}
              </div>
            </div>
            {/* Schedule */}
            <div className="flex flex-col text-left mt-10">
              <h1 className="text-primary-red font-semibold text-base">
                Available Meet Up Schedules
              </h1>
              <p className="text-sm text-gray-500">
                Seller’s available time and dates for meet-ups are listed below
              </p>
              <div className="mt-4">
                <CalendarViewer
                  label="Meet-up Schedule"
                  value={getCalendarValue(order)}
                  timeSlots={timeSlots}
                />
              </div>
            </div>
            {/* Payment Method */}
            <div className="flex flex-col text-left mt-10">
              <h1 className="text-primary-red font-semibold text-base">
                Available Payment Methods{' '}
              </h1>
              <p className="text-sm text-gray-500">
                All payment transactions are made during meet ups
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {order.paymentMethods || order.payment_methods ? (
                  (order.paymentMethods || order.payment_methods).map(
                    (method, idx) => <GrayTag key={idx} text={method} />
                  )
                ) : (
                  <GrayTag text="No payment methods listed" />
                )}
              </div>
            </div>
          </div>
        </div>
        {/* PlaceOrder modal */}
        {showPlaceOrder && (
          <PlaceOrder
            order={customOrder || order}
            currentUser={currentUser}
            quantity={quantity}
            onClose={() => {
              setShowPlaceOrder(false);
              setCustomOrder(null);
            }}
          />
        )}
      </div>
      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 ">
          <div className="bg-white rounded-xl p-10 max-w-2xl w-full relative">
            <button
              className="absolute top-2 right-2 text-primary-red font-bold text-lg"
              onClick={() => setShowMapModal(false)}
              aria-label="Close Map"
            >
              ×
            </button>
            <div className="relative w-full">
              <img
                src={pupmap}
                alt="PUP Map Large"
                className="w-full rounded-2xl h-auto object-contain"
              />
            </div>
            {/* Normal mapping below the map */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6">
              {meetUpLocations.slice(0, 6).map((loc, idx) => (
                <div key={loc.value} className="flex items-center gap-2">
                  <span className="font-bold text-primary-red">{idx + 1}.</span>
                  <span className="text-gray-800">{loc.label}</span>
                </div>
              ))}
              {meetUpLocations.slice(6, 12).map((loc, idx) => (
                <div key={loc.value} className="flex items-center gap-2">
                  <span className="font-bold text-primary-red">{idx + 7}.</span>
                  <span className="text-gray-800">{loc.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 shadow-glow flex items-start justify-end">
          <div className="h-screen w-[30%] bg-white rounded-l-xl shadow-lg relative">
            <ChatApp onClose={() => setShowChat(false)} />
          </div>
        </div>
      )}
      {/* Offer Modal */}
      <Modal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
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
        onConfirm={() => {
          const min = Number(order.priceRange?.min) || 0;
          const max = Number(order.priceRange?.max) || 0;
          const num = Number(offerPrice);
          if (isNaN(num) || offerPrice === '' || num < min || num > max) {
            alert(`Offer price must be between ₱${min} and ₱${max}.`);
            return;
          }
          // Pass the custom price and message to PlaceOrder
          setCustomOrder({
            ...order,
            productPriceOffer: num,
            offerMessage,
          });
          setShowOfferModal(false);
          setShowPlaceOrder(true);
        }}
      />
    </MainDashboard>
  );
}
