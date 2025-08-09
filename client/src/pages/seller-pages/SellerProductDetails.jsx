import { useState, useMemo, useEffect } from 'react';
import {
  MainDashboard,
  GrayTag,
  CalendarViewer,
  StaticRatingStars,
  ImageCarousel,
  ReviewComponent,
  ChatApp,
  Modal,
} from '../../components';
import { DashboardBackButton } from '../../components/ui';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Edit, Eye, Trash2, TrendingUp, Package } from 'lucide-react';
import productCategories from '../../data/productCategories';
import { stallbanner, pupmap } from '../../assets';
import meetUpLocations from '../../data/meetUpLocations';
import timeSlots from '../../data/timeSlots';
import { getListing, getProductReview } from '../buyer-pages/queries/productDetailsQueries';
import { getUsersDetails } from '../../queries/index.js';
import { useAuthStore } from '../../store/authStore';

const getCategoryLabel = (value) => {
  const found = productCategories.find((cat) => cat.value === value);
  return found ? found.label : value;
};

function getCalendarValue(order) {
  const schedules = order?.available_schedules || order?.availableSchedules;
  if (!schedules) return [];
  return schedules.flatMap((sched) =>
    (sched.times || []).map((time) => [sched.date, time])
  );
}

export default function SellerProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { userID, data: userData } = useAuthStore();

  const listingId = params.id || location.state?.order?.listing_id || location.state?.order?.id;

  const [showMapModal, setShowMapModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: order = {},
    isLoading: orderLoading,
    error: orderError,
  } = getListing(listingId);

  // Check if current user is the owner of this listing - must be here to access order data
  const currentUserId = userData?.user_id || userID;
  const isOwner = order.seller_id ? currentUserId === order.seller_id : true; // Default to true while loading

  // Redirect if not the owner - place early to ensure consistent hook order
  useEffect(() => {
    if (order && order.seller_id && currentUserId && !isOwner) {
      navigate(`/buyer/view-product-details/${listingId}`);
    }
  }, [isOwner, order, listingId, navigate, currentUserId]);

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

  const handleEditListing = () => {
    navigate('/edit-listing', { state: { listing: order } });
  };

  const handleDeleteListing = () => {
    setShowDeleteModal(true);
  };

  const handleViewAsCustomer = () => {
    navigate(`/buyer/view-product-details/${listingId}`);
  };

  const handleViewAnalytics = () => {
    navigate(`/seller/analytics/${listingId}`);
  };

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

  // Don't render anything if we're redirecting (the useEffect at the top handles the navigation)
  if (order && order.seller_id && currentUserId && !isOwner) {
    return null;
  }

  return (
    <MainDashboard>
      <DashboardBackButton />
      
      <div className="flex flex-col w-[80%] min-h-screen mt-5">
        {/* Seller Actions Header */}
        <div className="flex justify-between items-center mb-6 p-4 bg-blue-50 rounded-lg">
          <div>
            <h2 className="text-lg font-semibold text-blue-800">Managing Your Listing</h2>
            <p className="text-sm text-blue-600">You are viewing this as the seller/owner</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleViewAsCustomer}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Eye size={16} />
              View as Customer
            </button>
            <button
              onClick={handleEditListing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit size={16} />
              Edit Listing
            </button>
            <button
              onClick={handleViewAnalytics}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <TrendingUp size={16} />
              Analytics
            </button>
            <button
              onClick={handleDeleteListing}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        {/* Product Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2">
              <Package className="text-blue-500" size={20} />
              <span className="text-gray-600">In Stock</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{order.stock || order.total_stock || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-500" size={20} />
              <span className="text-gray-600">Sold</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{order.sold_count || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">★</span>
              <span className="text-gray-600">Rating</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{averageRating.toFixed(1)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2">
              <span className="text-purple-500">📝</span>
              <span className="text-gray-600">Reviews</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{reviews.length}</p>
          </div>
        </div>

        {/* Rest of the component - similar to ViewProductDetails but without buyer actions */}
        <div className="flex flex-row gap-12 items-center">
          <div className="w-1/2">
            <ImageCarousel
              images={order.images || []}
              productName={order.productName || order.name}
            />
          </div>
          <div className="w-1/2 text-left space-y-5">
            <div className="flex flex-col gap-2">
              <div>
                <div className="flex flex-row justify-between">
                  <p className="text-primary-red text-base">
                    {getCategoryLabel(order.category)}
                  </p>
                  <span className={`px-2 py-1 rounded text-sm ${
                    order.status === 'active' ? 'bg-green-100 text-green-700' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <h1 className="text-4xl flex flex-wrap font-bold">
                  {order.productName || order.name}
                </h1>
              </div>
              <div className="flex flex-row items-center justify-between">
                <h2 className="text-3xl font-bold text-primary-red">
                  {order.hasPriceRange && order.priceRange
                    ? `PHP ${order.priceRange.min} - PHP ${order.priceRange.max}`
                    : `PHP ${order.productPrice}`}
                </h2>
                <div className="flex flex-col items-end">
                  <StaticRatingStars value={averageRating} />
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">
                    {averageRating} stars | {reviews.length} reviews
                  </p>
                </div>
              </div>
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
          </div>
        </div>

        {/* Reviews and Listing Details - similar structure but focused on management */}
        <div className="flex flex-row gap-12 mt-10">
          <div className="w-1/2">
            <div className="flex flex-row items-end justify-between">
              <h1 className="font-bold text-3xl text-primary-red text-left">
                Customer Reviews:
              </h1>
              <p className="text-gray-500 text-sm">
                {reviews ? reviews.length : 0} reviews | {order.sold_count || 0} items sold
              </p>
            </div>

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

          <div className="w-1/2">
            <h1 className="text-2xl font-bold text-primary-red mb-4">
              Listing Configuration
            </h1>
            
            {/* Show listing details that seller configured */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-red">Payment Methods</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(order.paymentMethods || order.payment_methods || []).map(
                    (method, idx) => <GrayTag key={idx} text={method} />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary-red">Meetup Locations</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(order.meetupLocations || order.seller_meetup_locations || []).map(
                    (loc, idx) => <GrayTag key={idx} text={loc} />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary-red">Available Schedules</h3>
                <div className="mt-2">
                  <CalendarViewer
                    label="Your available times"
                    value={getCalendarValue(order)}
                    timeSlots={timeSlots}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Listing"
        description="Are you sure you want to delete this listing? This action cannot be undone."
        type="confirm"
        onConfirm={() => {
          // TODO: Implement delete listing API call
          console.log('Deleting listing:', listingId);
          setShowDeleteModal(false);
          navigate('/dashboard');
        }}
      />
    </MainDashboard>
  );
}
