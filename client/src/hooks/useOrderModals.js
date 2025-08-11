import { useState } from "react";
import { OrderService } from "../services";

export default function useOrderModals(orderId, onStatusUpdate) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showMarkCompleteConfirm, setShowMarkCompleteConfirm] = useState(false);
  const [showMarkCompleteAlert, setShowMarkCompleteAlert] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
      await OrderService.updateOrderStatus(orderId, 'completed');
      setShowMarkCompleteConfirm(false);
      setShowMarkCompleteAlert(true);
      if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      console.error('Failed to mark order as complete:', error);
      alert(`Failed to mark order as complete: ${error.message || 'Unknown error'}`);
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
