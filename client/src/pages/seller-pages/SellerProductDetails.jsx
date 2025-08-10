import { useState, useMemo, useEffect } from 'react';
import {
  MainDashboard,
  GrayTag,
  CalendarViewer,
  StaticRatingStars,
  ImageCarousel,
  ReviewComponent,
  ChatApp,
  Textfield,
  Textarea,
  Dropdown,
  Checkbox,
  CalendarPicker,
  ToggleButton,
  ImageUploader,
} from '../../components';
import { DashboardBackButton, StatusSelector } from '../../components/ui';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { TrendingUp, Package, Edit, Save, X, Check } from 'lucide-react';
import productCategories from '../../data/productCategories';
import paymentMethods from '../../data/paymentMethods';
import transactionMethods from '../../data/transactionMethods';
import meetUpLocations from '../../data/meetUpLocations';
import timeSlots from '../../data/timeSlots';
import { transformListingDataForUpdate } from '../../utils/listingTransform';
import { getListing, getProductReview } from '../buyer-pages/queries/productDetailsQueries';
import { getUsersDetails } from '../../queries/index.js';
import { ListingService } from '../../services/listingService.js';
import { useAuthStore } from '../../store/authStore';
import PUPMap from '../../assets/pupmap.png';

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

// Transform calendar format to meetup time slots format for backend
function transformCalendarToMeetupTimeSlots(calendarValue) {
  if (!calendarValue) {
    return [];
  }
  
  if (!Array.isArray(calendarValue)) {
    console.error('calendarValue is not an array:', calendarValue);
    return [];
  }
  
  if (calendarValue.length === 0) {
    return [];
  }
  
  const timeSlots = [];
  
  // Group by date first - handle mixed data formats
  const scheduleMap = {};
  try {
    calendarValue.forEach((item) => {
      // Handle array format: ['2025-08-25', '6:00 AM - 7:00 AM']
      if (Array.isArray(item)) {
        const [date, timeRange] = item;
        if (!scheduleMap[date]) {
          scheduleMap[date] = [];
        }
        scheduleMap[date].push(timeRange);
      }
      // Handle object format: {date: '2025-08-22', times: Array(3)}
      else if (item && typeof item === 'object' && item.date && item.times) {
        const date = item.date;
        if (!scheduleMap[date]) {
          scheduleMap[date] = [];
        }
        // Add all times for this date
        item.times.forEach(time => {
          scheduleMap[date].push(time);
        });
      }
      else {
        console.warn('Unknown calendar item format:', item);
      }
    });
    
    // Convert each time slot to backend format and merge consecutive slots
    Object.entries(scheduleMap).forEach(([date, times]) => {
      // Sort times to ensure proper order
      const sortedTimes = times.sort();
      
      // Group consecutive time slots
      const mergedSlots = [];
      let currentStart = null;
      let currentEnd = null;
      
      sortedTimes.forEach(timeRange => {
        let startTimeStr, endTimeStr;
        
        // Handle different time formats
        if (timeRange.includes(' - ')) {
          // Format: "6:00 AM - 7:00 AM" or "06:00-07:00"
          [startTimeStr, endTimeStr] = timeRange.split(' - ');
        } else if (timeRange.includes('-')) {
          // Format: "06:00-07:00"
          [startTimeStr, endTimeStr] = timeRange.split('-');
        } else {
          console.warn('Unknown time range format:', timeRange);
          return;
        }
        
        if (startTimeStr && endTimeStr) {
          // Convert both formats to 24-hour format
          const startTime24 = convertTimeToMilitary(startTimeStr.trim());
          const endTime24 = convertTimeToMilitary(endTimeStr.trim());
          
          if (startTime24 && endTime24) {
            // Check if this slot is consecutive to the current slot
            if (currentEnd === startTime24) {
              // Extend the current slot
              currentEnd = endTime24;
            } else {
              // Save the previous slot if it exists
              if (currentStart && currentEnd) {
                mergedSlots.push({ start: currentStart, end: currentEnd });
              }
              // Start a new slot
              currentStart = startTime24;
              currentEnd = endTime24;
            }
          }
        }
      });
      
      // Don't forget the last slot
      if (currentStart && currentEnd) {
        mergedSlots.push({ start: currentStart, end: currentEnd });
      }
      
      // Convert merged slots to final format
      mergedSlots.forEach(slot => {
        // Handle midnight crossing
        let startDate = date;
        let endDate = date;
        
        // If end time is "00:00" and start time is after noon, end time is next day
        if (slot.end === '00:00' && slot.start !== '00:00') {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          endDate = nextDay.toISOString().split('T')[0];
        }
        
        // Create ISO strings directly to avoid timezone issues
        const startDateTime = `${startDate}T${slot.start}:00.000Z`;
        const endDateTime = `${endDate}T${slot.end}:00.000Z`;
        
        // Validate the datetime strings
        const startDateObj = new Date(startDateTime);
        const endDateObj = new Date(endDateTime);
        
        if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime()) && startDateObj < endDateObj) {
          const timeSlot = {
            start_time: startDateTime,
            end_time: endDateTime
          };
          timeSlots.push(timeSlot);
        }
      });
    });
  } catch (error) {
    console.error('Error in transformCalendarToMeetupTimeSlots:', error);
    console.error('calendarValue that caused error:', calendarValue);
    return [];
  }
  
  return timeSlots;
}

// Convert time string to 24-hour format - handles both "6:00 AM" and "06:00" formats
function convertTimeToMilitary(timeStr) {
  try {
    timeStr = timeStr.trim();
    
    // If it's already in 24-hour format (no AM/PM)
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
      // Validate the format HH:MM
      const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
      if (timeRegex.test(timeStr)) {
        // Ensure it's in HH:MM format
        const [hours, minutes] = timeStr.split(':');
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
      return null;
    }
    
    // Handle AM/PM format
    const isPM = timeStr.includes('PM');
    const isAM = timeStr.includes('AM');
    
    if (!isPM && !isAM) return null;
    
    // Remove AM/PM and get time part
    const timePart = timeStr.replace(/\s*(AM|PM)/i, '').trim();
    const [hourStr, minuteStr] = timePart.split(':');
    
    if (!hourStr || !minuteStr) return null;
    
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    
    if (isNaN(hour) || isNaN(minute) || hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      return null;
    }
    
    // Convert to 24-hour format
    if (isPM && hour !== 12) {
      hour += 12;
    } else if (isAM && hour === 12) {
      hour = 0; // 12:00 AM = 00:00
    }
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error converting time:', error);
    return null;
  }
}

export default function SellerProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { userID, data: userData, token } = useAuthStore();

  const listingId = params.id || location.state?.order?.listing_id || location.state?.order?.id;

  const [showMapModal, setShowMapModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Editing states
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({});

  const {
    data: order = {},
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchOrder,
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

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      // Call the actual API to update listing status
      const response = await ListingService.updateListingStatus(listingId, newStatus);
      
      // Refetch the listing data to get updated status
      await refetchOrder();
      
    } catch (error) {
      console.error('Failed to update status:', error);
      // Show user-friendly error message
      alert(`Failed to update status: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Initialize edit data when order data is loaded
  useEffect(() => {
    if (order && Object.keys(order).length > 0) {
      setEditData({
        name: order.name || '',
        description: order.description || '',
        category: order.category || '',
        tags: order.tags || '',
        price_min: order.price_min || '',
        price_max: order.price_max || '',
        total_stock: order.total_stock || '',
        seller_meetup_locations: order.seller_meetup_locations || [],
        transaction_methods: order.transaction_methods || [],
        payment_methods: order.payment_methods || [],
        available_schedules: getCalendarValue(order), // Convert to calendar format
      });
    }
  }, [order]);

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSection = async (section) => {
    setIsSaving(true);
    try {
      let updateData = {};
      
      if (section === 'basic') {
        updateData = {
          name: editData.name,
          description: editData.description,
          category: editData.category,
          tags: editData.tags,
        };
      } else if (section === 'pricing') {
        updateData = {
          price_min: parseFloat(editData.price_min) || null,
          price_max: parseFloat(editData.price_max) || null,
          total_stock: parseInt(editData.total_stock) || null,
        };
      } else if (section === 'config') {
        // Only include fields that are being updated to avoid clearing existing data
        updateData = {};
        
        // Always update transaction methods if changed
        if (editData.transaction_methods !== undefined) {
          updateData.transaction_methods = editData.transaction_methods;
        }
        
        // Always update payment methods if changed
        if (editData.payment_methods !== undefined) {
          updateData.payment_methods = editData.payment_methods;
        }
        
        // Only update meetup locations if Meet-up is included in transaction methods
        if (editData.transaction_methods?.includes('Meet-up')) {
          updateData.seller_meetup_locations = editData.seller_meetup_locations || [];
          
          // Only update schedules if there are any available schedules
          if (editData.available_schedules?.length > 0) {
            const transformedSchedules = transformCalendarToMeetupTimeSlots(editData.available_schedules);
            
            if (transformedSchedules && transformedSchedules.length > 0) {
              updateData.meetup_time_slots = transformedSchedules;
            }
          } else {
            // Explicitly set empty array to clear existing schedules if needed
            updateData.meetup_time_slots = [];
          }
        } else if (editData.transaction_methods && !editData.transaction_methods.includes('Meet-up')) {
          // Only clear meetup data if transaction methods explicitly exclude Meet-up
          updateData.seller_meetup_locations = [];
          updateData.meetup_time_slots = [];
        }
      }

      const response = await ListingService.updateListing(listingId, updateData);
      
      if (response.success) {
        // Refetch the listing data to show updated information
        await refetchOrder();
        
        // Exit edit mode
        if (section === 'basic') setIsEditingBasic(false);
        if (section === 'pricing') setIsEditingPricing(false);
        if (section === 'config') setIsEditingConfig(false);
      } else {
        throw new Error(response.message || 'Failed to update listing');
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      alert(`Failed to update: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = (section) => {
    // Reset edit data to current order data
    if (order) {
      setEditData({
        name: order.name || '',
        description: order.description || '',
        category: order.category || '',
        tags: order.tags || '',
        price_min: order.price_min || '',
        price_max: order.price_max || '',
        total_stock: order.total_stock || '',
        seller_meetup_locations: order.seller_meetup_locations || [],
        transaction_methods: order.transaction_methods || [],
        payment_methods: order.payment_methods || [],
        available_schedules: getCalendarValue(order),
      });
    }
    
    // Exit edit mode
    if (section === 'basic') setIsEditingBasic(false);
    if (section === 'pricing') setIsEditingPricing(false);
    if (section === 'config') setIsEditingConfig(false);
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
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Listing Status
              </label>
              <div className="min-w-[200px]">
                <StatusSelector
                  currentStatus={order.status || 'active'}
                  onStatusChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                />
              </div>
            </div>
            {isUpdatingStatus && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Updating...</span>
              </div>
            )}
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

        {/* Rest of the component - similar to ViewProductDetails but with inline editing */}
        <div className="flex flex-row gap-12 items-start">
          <div className="w-1/2">
            <ImageCarousel
              images={order.images || []}
              productName={order.productName || order.name}
            />
          </div>
          <div className="w-1/2 text-left space-y-5">
            {/* Basic Information Section */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                {!isEditingBasic ? (
                  <button
                    onClick={() => setIsEditingBasic(true)}
                    className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveSection('basic')}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={14} />
                      Save
                    </button>
                    <button
                      onClick={() => handleCancelEdit('basic')}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {!isEditingBasic ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex flex-row justify-between items-start">
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
                    <h1 className="text-3xl font-bold mb-2">
                      {order.productName || order.name}
                    </h1>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-primary-red mb-1">
                      Product Description
                    </p>
                    <p className="text-sm text-gray-800">
                      {order.productDescription || order.description || 'No description provided.'}
                    </p>
                  </div>
                  {order.tags && (
                    <div>
                      <p className="text-base font-semibold text-primary-red mb-1">Tags</p>
                      <p className="text-sm text-gray-600">{order.tags}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <Textfield
                      label=""
                      value={editData.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <Dropdown
                      label=""
                      value={editData.category}
                      onChange={(value) => handleEditChange('category', value)}
                      options={productCategories}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Textarea
                      label=""
                      value={editData.description}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      placeholder="Enter product description"
                      rows="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <Textfield
                      label=""
                      value={editData.tags}
                      onChange={(e) => handleEditChange('tags', e.target.value)}
                      placeholder="Enter tags (comma separated)"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pricing & Stock Section */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Pricing & Stock</h3>
                {!isEditingPricing ? (
                  <button
                    onClick={() => setIsEditingPricing(true)}
                    className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveSection('pricing')}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={14} />
                      Save
                    </button>
                    <button
                      onClick={() => handleCancelEdit('pricing')}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {!isEditingPricing ? (
                <div className="space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold text-primary-red">
                      {order.hasPriceRange && order.priceRange
                        ? `PHP ${order.priceRange.min} - PHP ${order.priceRange.max}`
                        : order.price_min === order.price_max
                        ? `PHP ${order.price_min || order.productPrice}`
                        : `PHP ${order.price_min} - PHP ${order.price_max}`}
                    </h2>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Stock: {order.stock || order.total_stock || 0} units
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Price (PHP)
                      </label>
                      <Textfield
                        label=""
                        type="number"
                        value={editData.price_min}
                        onChange={(e) => handleEditChange('price_min', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Price (PHP)
                      </label>
                      <Textfield
                        label=""
                        type="number"
                        value={editData.price_max}
                        onChange={(e) => handleEditChange('price_max', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Stock
                    </label>
                    <Textfield
                      label=""
                      type="number"
                      value={editData.total_stock}
                      onChange={(e) => handleEditChange('total_stock', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rating Display */}
            <div className="flex flex-col items-start">
              <StaticRatingStars value={averageRating} />
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {averageRating} stars | {reviews.length} reviews
              </p>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section - Compact Horizontal Layout */}
        <div className="mt-10">
          <div className="flex flex-row items-end justify-between mb-4">
            <h1 className="font-bold text-2xl text-primary-red text-left">
              Customer Reviews:
            </h1>
            <p className="text-gray-500 text-sm">
              {reviews ? reviews.length : 0} reviews | {order.sold_count || 0} items sold
            </p>
          </div>

          <div className="mb-8">
            {reviews && reviews.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {(showAllReviews ? reviews : reviews.slice(0, 6)).map(
                    (review, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={review.user.avatar}
                            alt="User Avatar"
                            className="w-6 h-6 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {review.user.name}
                            </p>
                            <p className="text-xs text-gray-400">{review.date}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="scale-75 origin-left">
                              <StaticRatingStars value={review.rating} />
                            </div>
                            <span className="text-xs text-gray-600">{review.rating}/5</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-2">{review.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{review.helpfulCount || 0} found helpful</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
                {!showAllReviews && reviews.length > 6 && (
                  <button
                    className="text-primary-red font-semibold hover:underline"
                    onClick={() => setShowAllReviews(true)}
                  >
                    Show All {reviews.length} Reviews
                  </button>
                )}
              </>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-500">No reviews yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Listing Configuration Section */}
        <div className="w-full">
            <h1 className="text-2xl font-bold text-primary-red mb-4 text-left">
              Listing Configuration
            </h1>
            
            {/* Configuration Section */}
            <div className="space-y-6">
              <div className="flex justify-end items-center mb-4">
                {!isEditingConfig ? (
                  <button
                    onClick={() => setIsEditingConfig(true)}
                    className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveSection('config')}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={14} />
                      Save
                    </button>
                    <button
                      onClick={() => handleCancelEdit('config')}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {!isEditingConfig ? (
                <div className="space-y-8">
                  {/* Payment & Transaction Methods with separate borders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-primary-red mb-4">Payment Methods</h4>
                      <div className="flex flex-wrap gap-2">
                        {(order.paymentMethods || order.payment_methods || []).map(
                          (method, idx) => <GrayTag key={idx} text={method} />
                        )}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-primary-red mb-4">Transaction Methods</h4>
                      <div className="flex flex-wrap gap-2">
                        {(order.transactionMethods || order.transaction_methods || []).map(
                          (method, idx) => <GrayTag key={idx} text={method} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Show Meetup Locations and Schedules only if Meet-up is selected */}
                  {(order.transactionMethods || order.transaction_methods || []).includes('Meet-up') && (
                    <>
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-primary-red mb-4">Meetup Locations</h4>
                        <div className="flex flex-wrap gap-2">
                          {(order.meetupLocations || order.seller_meetup_locations || []).length > 0 ? (
                            (order.meetupLocations || order.seller_meetup_locations || []).map(
                              (loc, idx) => <GrayTag key={idx} text={loc} />
                            )
                          ) : (
                            <span className="text-sm text-gray-500 italic">No meetup locations selected</span>
                          )}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-primary-red mb-4">Available Schedules</h4>
                        <CalendarViewer
                          label="Your available times"
                          value={getCalendarValue(order)}
                          timeSlots={timeSlots}
                        />
                      </div>
                    </>
                  )}

                </div>
              ) : (
                <div className="space-y-8">
                  {/* Payment & Transaction Methods with separate borders and consistent order */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-primary-red mb-4">Payment Methods</h4>
                      <div className="flex gap-2 flex-wrap">
                        {paymentMethods
                          .filter(method => {
                            const isOnlineOnly = editData.transaction_methods?.length === 1 && 
                                                editData.transaction_methods[0] === 'Online';
                            if (isOnlineOnly) {
                              return ['GCash', 'Maya', 'Bank Transfer', 'Remittance'].includes(method.value);
                            }
                            return true;
                          })
                          .map((method) => {
                            const isActive = editData.payment_methods?.includes(method.value);
                            return (
                              <ToggleButton
                                key={method.value}
                                label={method.label}
                                isActive={isActive}
                                onClick={() => {
                                  const currentMethods = editData.payment_methods || [];
                                  const newMethods = isActive
                                    ? currentMethods.filter(m => m !== method.value)
                                    : [...currentMethods, method.value];
                                  handleEditChange('payment_methods', newMethods);
                                }}
                              />
                            );
                          })}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-primary-red mb-4">Transaction Methods</h4>
                      <div className="flex gap-2 flex-wrap">
                        {transactionMethods.map((method) => {
                          const isActive = editData.transaction_methods?.includes(method.value);
                          return (
                            <ToggleButton
                              key={method.value}
                              label={method.label}
                              isActive={isActive}
                              onClick={() => {
                                const currentMethods = editData.transaction_methods || [];
                                const newMethods = isActive
                                  ? currentMethods.filter(m => m !== method.value)
                                  : [...currentMethods, method.value];
                                handleEditChange('transaction_methods', newMethods);
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Meetup Locations Container - only show if Meet-up is selected */}
                  {editData.transaction_methods?.includes('Meet-up') && (
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-primary-red mb-4">Meet-up Locations</h4>
                      <div className="w-full gap-8 flex flex-row justify-between">
                        <div className="w-2/3">
                          <img
                            src={PUPMap}
                            alt="PUP Campus Map"
                            className="w-full h-auto rounded-2xl shadow-md"
                          />
                        </div>
                        <div className="w-1/3">
                          <div className="space-y-2">
                            {meetUpLocations.map((location, idx) => (
                              <Checkbox
                                key={location.value}
                                id={`location-${location.value}`}
                                label={`${idx + 1}. ${location.label}`}
                                checked={editData.seller_meetup_locations?.includes(location.value) || false}
                                onChange={(e) => {
                                  const currentLocations = editData.seller_meetup_locations || [];
                                  const isChecked = !currentLocations.includes(location.value);
                                  if (isChecked) {
                                    handleEditChange('seller_meetup_locations', [...currentLocations, location.value]);
                                  } else {
                                    handleEditChange('seller_meetup_locations', currentLocations.filter(l => l !== location.value));
                                  }
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Available Schedules Container - only show if Meet-up is selected */}
                  {editData.transaction_methods?.includes('Meet-up') && (
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-primary-red mb-4">Available Schedules</h4>
                      <CalendarPicker
                        label="Available Schedules"
                        value={editData.available_schedules || []}
                        onChange={(newSchedules) => handleEditChange('available_schedules', newSchedules)}
                        timeSlots={timeSlots}
                      />
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
      </div>
    </MainDashboard>
  );
}

const Container = ({ children }) => (
  <div className="w-full relative rounded-xl bg-white shadow-light flex flex-col text-left justify-center items-center">
    <div className="w-full space-y-6 px-10 py-8">{children}</div>
  </div>
);
