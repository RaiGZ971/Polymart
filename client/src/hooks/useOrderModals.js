import { useState } from 'react';
import { OrderService } from '../services';
import { postNotification } from '../queries/postNotification.js';
import { formattedNotification } from '../utils/formattedNotification.js';

export default function useOrderModals(orderId, onStatusUpdate) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showMarkCompleteConfirm, setShowMarkCompleteConfirm] = useState(false);
  const [showMarkCompleteAlert, setShowMarkCompleteAlert] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { mutateAsync: uploadNotification } = postNotification();

  const handleCancelClick = () => setShowConfirm(true);

  const handleConfirmCancel = async () => {
    if (!orderId) {
      setShowConfirm(false);
      setShowAlert(true);
      return;
    }

    setIsUpdating(true);
    try {
      await OrderService.updateOrderStatus(orderId, 'cancelled');
      setShowConfirm(false);
      setShowAlert(true);
      if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert(`Failed to cancel order: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAlertClose = () => setShowAlert(false);
  const handleMarkCompleteClick = () => setShowMarkCompleteConfirm(true);

  const handleConfirmMarkComplete = async () => {
    if (!orderId) {
      setShowMarkCompleteConfirm(false);
      setShowMarkCompleteAlert(true);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedStatus = await OrderService.updateOrderStatus(
        orderId,
        'completed'
      );

      const sellerNotification = await uploadNotification(
        formattedNotification({
          userID: updatedStatus.data.seller_id,
          notificationType: 'order',
          content: `Congratulations, ${updatedStatus.data.listing.seller_username}! The transaction for ${updatedStatus.data.listing.name} has been successfully completed. Don't forget to review your customer.`,
          relatedID: String(updatedStatus.data.order_id),
        })
      );

      console.log('NOTIFICATION UPLOADED: ', sellerNotification);

      const buyerNotification = await uploadNotification(
        formattedNotification({
          userID: updatedStatus.data.buyer_id,
          notificationType: 'order',
          content: `Congratulations! The transaction for ${updatedStatus.data.listing.name} by ${updatedStatus.data.listing.seller_username} is now officially complete. Please check your product and share your review.`,
          relatedID: String(updatedStatus.data.order_id),
        })
      );

      console.log('NOTIFICATION UPLOADED: ', buyerNotification);

      setShowMarkCompleteConfirm(false);
      setShowMarkCompleteAlert(true);
      if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      console.error('Failed to mark order as complete:', error);
      alert(
        `Failed to mark order as complete: ${error.message || 'Unknown error'}`
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkCompleteAlertClose = () => setShowMarkCompleteAlert(false);

  return {
    showConfirm,
    showAlert,
    showMarkCompleteConfirm,
    showMarkCompleteAlert,
    isUpdating,
    handleCancelClick,
    handleConfirmCancel,
    handleAlertClose,
    setShowConfirm,
    setShowMarkCompleteConfirm,
    handleMarkCompleteClick,
    handleConfirmMarkComplete,
    handleMarkCompleteAlertClose,
  };
}
