import { useState } from "react";

export default function useOrderModals() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showReceivedConfirm, setShowReceivedConfirm] = useState(false);
  const [showReceivedAlert, setShowReceivedAlert] = useState(false);
  const [showMarkCompleteConfirm, setShowMarkCompleteConfirm] = useState(false);
  const [showMarkCompleteAlert, setShowMarkCompleteAlert] = useState(false); // NEW

  const handleCancelClick = () => setShowConfirm(true);
  const handleConfirmCancel = () => {
    setShowConfirm(false);
    setShowAlert(true);
  };
  const handleAlertClose = () => setShowAlert(false);
  const handleItemReceivedClick = () => setShowReceivedConfirm(true);
  const handleConfirmReceived = () => {
    setShowReceivedConfirm(false);
    setShowReceivedAlert(true);
  };
  const handleLeaveReview = () => setShowReceivedAlert(false);
  const handleNoThanks = () => setShowReceivedAlert(false);
  const handleMarkCompleteClick = () => setShowMarkCompleteConfirm(true);
  const handleConfirmMarkComplete = () => {
    setShowMarkCompleteConfirm(false);
    setShowMarkCompleteAlert(true); // Show alert after confirm
    // TODO: handle mark as complete logic (API call, etc)
  };
  const handleMarkCompleteAlertClose = () => setShowMarkCompleteAlert(false); // NEW

  return {
    showConfirm,
    showAlert,
    showReceivedConfirm,
    showReceivedAlert,
    showMarkCompleteConfirm,
    showMarkCompleteAlert, // NEW
    handleCancelClick,
    handleConfirmCancel,
    handleAlertClose,
    handleItemReceivedClick,
    handleConfirmReceived,
    handleLeaveReview,
    handleNoThanks,
    setShowConfirm,
    setShowReceivedConfirm,
    setShowMarkCompleteConfirm,
    handleMarkCompleteClick,
    handleConfirmMarkComplete,
    handleMarkCompleteAlertClose, // NEW
  };
}
