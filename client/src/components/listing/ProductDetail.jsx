import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { ChevronLeft } from 'lucide-react';
import {
  Items,
  MeetUpDetails,
  ActionButtons,
  LeaveReviewComponent,
  Modal,
  ChatApp,
  BackButton,
} from '@/components';

import { useOrderModals } from '@/hooks';
import { getUserDetails, postNotification } from '../../queries/index.js';
import { postReview } from './queries/useProductDetailQueries.js';
import {
  formattedUserContact,
  formattedReview,
  formattedNotification,
  getDate,
  getTime,
} from '../../utils/index.js';

const statusColor = {
  pending: '#FBBC04',
  confirmed: '#2670F9',
  completed: '#34A853',
  cancelled: '#FF0000',
};

function getStatusLabel(status) {
  if (!status) return '';
  const map = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[status.toLowerCase()] || status;
}

export default function ProductDetail({
  order,
  onBack,
  role,
  onAcceptOrder,
  onRejectOrder,
  onStatusUpdate,
}) {
  const {
    showConfirm,
    showAlert,
    handleCancelClick,
    handleConfirmCancel,
    handleAlertClose,
    setShowConfirm,
    showMarkCompleteConfirm,
    showMarkCompleteAlert,
    setShowMarkCompleteConfirm,
    handleMarkCompleteClick,
    handleConfirmMarkComplete,
    handleMarkCompleteAlertClose,
    isUpdating,
  } = useOrderModals(order?.id || order?.order_id, onStatusUpdate);

  // Add state for LeaveReview modal
  const [showLeaveReview, setShowLeaveReview] = useState(false);
  const [reviewData, setReviewData] = useState();
  const [confirmType, setConfirmType] = useState('');

  // Chat modal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [chatInitialView, setChatInitialView] = useState('preview');

  const sendReview = postReview();
  const sendNotification = postNotification();

  const {
    data: sellerProfile = {},
    isLoading: buyerContactLoading,
    error: buyerContactError,
  } = getUserDetails(role === 'user' ? order.seller_id : order.buyer_id);

  const handleOpenChat = () => {
    const response = {
      ...formattedUserContact(sellerProfile),
      productID: order.listing_id,
    };

    console.log('PRODUCT DETAILS: ', response);
    setChatData(response);
    setChatInitialView('chat');
    setShowChatModal(true);
  };

  if (!order) return null;

  const items = order.productsOrdered || order.items || [];
  const isUserPlaced =
    role === 'user' &&
    (order.status?.toLowerCase() === 'placed' ||
      order.status?.toLowerCase() === 'order placed');

  const handleOpenLeaveReview = () => {
    setShowLeaveReview(true);
  };

  // Handler for closing the LeaveReviewComponent
  const handleCloseLeaveReview = () => setShowLeaveReview(false);

  useEffect(() => {
    if (reviewData?.remarks) {
      const orderForm = {
        productID: String(order.listing_id),
        orderID: String(order.id),
      };

      const form = formattedReview(reviewData, orderForm, 'Product');
      console.log('FORM ', form);
      sendReview.mutate(form, {
        onSuccess: (data) => {
          console.log('Uploaded Review in dynamodb: ', data);
        },
      });

      sendNotification.mutate(
        formattedNotification(
          {
            userID: form.reviewee_id,
            notificationType: 'review',
            content: `You’ve received a new review for ${order.listing.name}. Check it out now!`,
            relatedID: String(form.order_id),
          },
          {
            onSuccess: (data) => {
              console.log('NOTIFICATION UPLOADED: ', data);
            },
          }
        )
      );
    }
  }, [reviewData]);

  return (
    <>
      <div className="bg-white shadow-glow text-left space-y-8 flex flex-col rounded-xl">
        <BackButton onClick={onBack} className="pt-4" />
        {/* Header */}
        <div className="px-20 flex flex-row items-center justify-between">
          <h1 className="text-3xl font-bold text-primary-red">Order Details</h1>
          <p
            style={{
              color: statusColor[order.status?.toLowerCase()] || '#333',
              fontWeight: 'bold',
              textTransform: 'capitalize',
            }}
          >
            {getStatusLabel(order.status)}
          </p>
        </div>
        {/* Buyer Details */}
        <div className="flex flex-row justify-between px-20">
          <div className="flex flex-row items-center gap-4">
            <img
              src={order.userAvatar || 'https://picsum.photos/247/245'}
              alt="User Image"
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <p className="font-bold text-xl">{order.username}</p>
              <p className="text-gray-500">PUP Sta Mesa | CCIS</p>
            </div>
          </div>
          <button
            className="bg-primary-red text-white px-4 py-1 max-h-10 rounded-lg hover:bg-hover-red transition-colors text-sm"
            onClick={() => handleOpenChat()}
          >
            {role === 'user' ? 'Message Seller' : 'Message Buyer'}
          </button>
        </div>

        <div className="px-20">
          <Container>
            <MeetUpDetails order={order} />
          </Container>
        </div>

        <div className="px-20">
          <Container>
            {/* Pass the updated items array as a prop */}
            <Items order={{ ...order, productsOrdered: items }} />
          </Container>
        </div>
        <div className="w-full px-24 py-4 flex flex-row justify-between items-center bg-white shadow-light rounded-b-xl">
          <ActionButtons
            order={order}
            role={role}
            isUserPlaced={isUserPlaced}
            onCancelClick={handleCancelClick}
            onMarkCompleteClick={handleMarkCompleteClick}
            onLeaveReviewClick={handleOpenLeaveReview}
            onAcceptOrder={onAcceptOrder}
            onRejectOrder={onRejectOrder}
          />
        </div>
        {/* Modals */}
        <Modal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Cancel Order"
          description="Are you sure you want to cancel this order?"
          type="confirm"
          onConfirm={handleConfirmCancel}
        />
        <Modal
          isOpen={showAlert}
          onClose={handleAlertClose}
          title="Order Cancelled"
          description="Your order has been cancelled."
          type="alert"
          onConfirm={handleAlertClose}
        />
        {/* LeaveReviewComponent Modal */}
        <LeaveReviewComponent
          isOpen={showLeaveReview}
          onClose={handleCloseLeaveReview}
          userProfile={sellerProfile}
          onSubmitReview={(reviewData) => {
            setReviewData(reviewData);
            setShowLeaveReview(false);
          }}
        />
        <Modal
          isOpen={showMarkCompleteConfirm}
          onClose={() => setShowMarkCompleteConfirm(false)}
          title="Mark as Complete?"
          description="Are you sure you want to mark this order as complete?"
          type="confirm"
          onConfirm={handleConfirmMarkComplete}
        />
        <Modal
          isOpen={showMarkCompleteAlert} // NEW
          onClose={handleMarkCompleteAlertClose}
          title="Marked as Complete"
          description="Order has been marked as complete."
          type="alert"
          onConfirm={handleMarkCompleteAlertClose}
        />
        {/* Chat Modal - Add this section */}
        {showChatModal &&
          createPortal(
            <div className="fixed inset-0 z-50 shadow-glow flex items-start justify-end">
              <div className="h-screen w-[30%] bg-white rounded-l-xl shadow-lg relative">
                <ChatApp
                  initialChatId={chatData?.id}
                  initialView={chatInitialView}
                  initialChatData={chatData}
                  onClose={() => setShowChatModal(false)}
                  fromOrderDetails={true}
                />
              </div>
            </div>,
            document.body
          )}
      </div>
    </>
  );
}

const Container = ({ children }) => (
  <div className="w-full relative rounded-xl bg-white shadow-light flex flex-col text-left justify-center items-center">
    <div className="w-full space-y-6 px-10 py-8">{children}</div>
  </div>
);
