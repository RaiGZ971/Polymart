import { useState, useEffect } from 'react';
import {
  MainDashboard,
  OrdersListingsComponent,
  DropdownFilter,
  ProductDetail,
  Modal,
} from '@/components';
import DashboardBackButton from '../../components/ui/DashboardBackButton';
import { meetUpLocationsFilter, orderStatus } from '@/data';
import { useOrdersData } from '../../hooks';
import { UserService, OrderService } from '../../services';
import { formattedNotification } from '../../utils/formattedNotification.js';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { postNotification } from '../../queries/postNotification.js';

export default function OrdersMeetups() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(orderStatus[0].value);
  const [selectedLocation, setSelectedLocation] = useState(
    meetUpLocationsFilter[0]?.value || ''
  );
  const [activeTab, setActiveTab] = useState('orders');
  const [currentUser, setCurrentUser] = useState(null);

  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [message, setMessage] = useState('');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  const navigate = useNavigate();

  // Use the orders data hook
  const { orders, loading, error, getFilteredOrders, getCounts, refreshData } =
    useOrdersData();

  // Get counts for tabs - destructure directly from the memoized object
  const { yourOrdersCount, listingsCount } = getCounts;

  const { mutateAsync: uploadNotification } = postNotification();

  // Get current user on component mount
  useEffect(() => {
    const user = UserService.getCurrentUser();
    setCurrentUser(user);

    // If user is not authenticated, redirect to login
    if (!user) {
      navigate('/sign-in');
      return;
    }
  }, [navigate]);

  const handleBack = () => setSelectedOrder(null);

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
  };

  const handleLocationChange = (value) => {
    setSelectedLocation(value);
  };

  // Handle accept order action
  const handleAcceptOrder = () => {
    setDialogType('accept');
    setMessage('');
    setShowMessageDialog(true);
  };

  // Handle reject order action
  const handleRejectOrder = () => {
    setDialogType('reject');
    setMessage('');
    setShowMessageDialog(true);
  };

  // Handle message dialog confirmation
  const handleMessageConfirm = async () => {
    if (!selectedOrder) return;

    setIsUpdatingOrder(true);

    try {
      // Determine the new status based on dialog type
      const newStatus = dialogType === 'accept' ? 'confirmed' : 'cancelled';

      // Call the API to update order status
      await OrderService.updateOrderStatus(selectedOrder.id, newStatus);

      if (newStatus === 'confirmed') {
        const sellerNotification = await uploadNotification(
          formattedNotification({
            userID: useAuthStore.getState().userID,
            notificationType: 'order',
            content: `You have confirmed the order of ${selectedOrder.listing.name} for ${selectedOrder.username}. Please prepare the item and ready for pick-up.`,
            relatedID: String(selectedOrder.id),
          })
        );

        console.log('NOTIFICATION UPLOADED: ', sellerNotification);

        const buyerNotification = await uploadNotification(
          formattedNotification({
            userID: selectedOrder.buyer_id,
            notificationType: 'order',
            content: `Hi ${selectedOrder.username}, your order for ${selectedOrder.listing.name} has been confirmed. We’re preparing your item—please get ready for pick-up soon.`,
            relatedID: String(selectedOrder.id),
          })
        );

        console.log('NOTIFICATION UPLOADED: ', buyerNotification);

        const sellerMeetupNotification = await uploadNotification(
          formattedNotification({
            userID: useAuthStore.getState().userID,
            notificationType: 'meetup',
            content: `Your meetup with ${selectedOrder.username} is scheduled on ${selectedOrder.schedule}. Location: ${selectedOrder.meetup.location}.`,
            relatedID: String(selectedOrder.id),
          })
        );

        console.log('NOTIFICATION UPLOADED: ', sellerMeetupNotification);

        const buyerMeetupNotification = await uploadNotification(
          formattedNotification({
            userID: selectedOrder.buyer_id,
            notificationType: 'meetup',
            content: `Reminder. You have a scheduled meetup with ${selectedOrder.sellerUsername} on ${selectedOrder.schedule}. Location: ${selectedOrder.meetup.location}.`,
            relatedID: String(selectedOrder.id),
          })
        );

        console.log('NOTIFICATION UPLOADED: ', buyerMeetupNotification);
      }
      // Refresh the orders data to reflect the changes
      await refreshData();

      // Close dialog and reset state
      setShowMessageDialog(false);
      setMessage('');
      setDialogType('');

      // Go back to orders list to see updated status
      setSelectedOrder(null);
    } catch (error) {
      console.error(`Failed to ${dialogType} order:`, error);
      alert(
        `Failed to ${dialogType} order: ${error.message || 'Unknown error'}`
      );
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Handle message dialog close
  const handleMessageClose = () => {
    if (isUpdatingOrder) return; // Prevent closing while updating
    setShowMessageDialog(false);
    setMessage('');
    setDialogType('');
  };

  // Filter data based on activeTab, selectedStatus, and selectedLocation
  const filteredData = getFilteredOrders(
    selectedStatus,
    selectedLocation,
    activeTab
  );

  return (
    <MainDashboard>
      <DashboardBackButton />

      <div className="flex flex-col w-[80%] min-h-screen mt-5">
        {/* Header - Always visible */}
        <h1 className="text-left mb-6 font-bold text-4xl text-primary-red">
          Orders & Meet Ups
        </h1>

        {/* Content - Shows different states */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-red"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <div className="text-lg text-red-500 mb-4">Error: {error}</div>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-primary-red text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="w-full items-center space-y-6">
            <nav className="flex flex-row border-b-2 border-gray-300 pb-4 justify-between">
              <div className="flex flex-row gap-4">
                <button
                  className={`font-semibold ${
                    activeTab === 'orders'
                      ? 'text-primary-red underline'
                      : 'text-gray-400 hover:text-primary-red'
                  }`}
                  onClick={() => setActiveTab('orders')}
                >
                  Your Orders ({yourOrdersCount})
                </button>
                <span className="font-semibold text-gray-400">|</span>
                <button
                  className={`font-semibold ${
                    activeTab === 'listings'
                      ? 'text-primary-red underline'
                      : 'text-gray-400 hover:text-primary-red'
                  }`}
                  onClick={() => setActiveTab('listings')}
                >
                  From My Listings ({listingsCount})
                </button>
              </div>
              <div className="flex flex-row gap-4">
                <DropdownFilter
                  options={meetUpLocationsFilter}
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  selectedOption={selectedLocation}
                  labelPrefix="Location"
                  placeholder="All"
                />

                <DropdownFilter
                  options={orderStatus}
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  selectedOption={selectedStatus}
                  labelPrefix="Status"
                  placeholder="All"
                />
              </div>
            </nav>
            {selectedOrder ? (
              <ProductDetail
                order={selectedOrder}
                onBack={handleBack}
                role={selectedOrder.role}
                onAcceptOrder={handleAcceptOrder}
                onRejectOrder={handleRejectOrder}
                onStatusUpdate={async () => {
                  await refreshData();
                  setSelectedOrder(null);
                }}
              />
            ) : filteredData.length > 0 ? (
              filteredData.map((order, idx) => (
                <div key={idx} onClick={() => setSelectedOrder(order)}>
                  <OrdersListingsComponent {...order} />
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-10 text-lg font-semibold">
                No matches for your filters.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Dialog Modal */}
      <Modal
        isOpen={showMessageDialog}
        onClose={handleMessageClose}
        onConfirm={handleMessageConfirm}
        type="message"
        title={dialogType === 'accept' ? 'Confirm Order' : 'Reject Order'}
        description={
          dialogType === 'accept'
            ? 'If you confirm the order, the order process will proceed.'
            : 'Once you reject the order, no further actions are allowed. Are you sure you want to proceed?'
        }
        isLoading={isUpdatingOrder}
      />
    </MainDashboard>
  );
}
