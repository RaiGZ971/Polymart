import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../store/authStore.js';
import { RatingStars, Textarea, Modal, Button, BackButton } from '@/components';

export default function LeaveReviewComponent({
  isOpen,
  onClose,
  userProfile,
  onSubmitReview,
}) {
  const [rating, setRating] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // PLACEHOLDER: Mock data - replace with actual user profile from props/backend
  const sellerProfile = userProfile;

  console.log(sellerProfile);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);

    const reviewData = {
      rating: rating,
      remarks: remarks.trim(),
      revieweeId: sellerProfile.user_id,
      reviewerId: useAuthStore.getState().userID,
    };

    try {
      if (onSubmitReview) {
        await onSubmitReview(reviewData);
      } else {
        console.log('BACKEND TODO: Submit review data:', reviewData);
      }
      setRating(0);
      setRemarks('');
      setShowAlert(true); // Show alert modal
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setRating(0);
    setRemarks('');
    onClose && onClose();
  };

  const handleAlertClose = () => {
    setShowAlert(false);
    onClose && onClose();
  };

  if (!isOpen && !showAlert) return null;

  // Review modal content
  const modalContent = (
    <div className="fixed inset-0 top-0 left-0 z-[100000] flex items-center justify-center bg-black bg-opacity-40 px-12 py-8">
      <div className="bg-white rounded-xl shadow-2xl max-h-[90vh] p-8 max-w-[650px] w-full relative flex flex-col">
        {/* Back button */}
        <div className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-gray-700 transition-colors z-10">
          {' '}
          <BackButton onClick={() => onClose()} />
        </div>

        {/* Content Container */}
        <div className="flex flex-col items-center px-12 pt-1 pb-4 h-full">
          <h1 className="text-3xl font-bold text-[#950000] mb-8">
            Leave A Review
          </h1>

          {/* Profile Section */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="rounded-full overflow-hidden mb-4 border border-gray-200 flex items-center justify-center bg-gray-100"
              style={{ width: '135px', height: '135px' }}
            >
              <img
                src={sellerProfile.profile_photo_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {sellerProfile.username}
            </h2>
            <p className="text-gray-600 text-sm">
              {sellerProfile.university_branch} | {sellerProfile.college}
            </p>
          </div>

          {/* Rating Stars */}
          <div className="mb-6 flex justify-center items-center w-full">
            <RatingStars value={rating} onChange={setRating} size="large" />
          </div>

          {/* Remarks Section */}
          <div className="mb-8 w-full flex justify-center">
            <Textarea
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center w-full mt-auto mb-2">
            <Button onClick={handleSkip} variant="graytext">
              Skip for now
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              variant="primary"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Alert modal content
  const alertModal = (
    <Modal
      isOpen={showAlert}
      onClose={handleAlertClose}
      onConfirm={handleAlertClose}
      title="Review submitted"
      description="Thanks for sharing your experience! Your review has been submitted."
      type="alert"
    />
  );

  // Only show one overlay at a time
  return (
    <>
      {isOpen && !showAlert && createPortal(modalContent, document.body)}
      {showAlert && createPortal(alertModal, document.body)}
    </>
  );
}
