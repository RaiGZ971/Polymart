import { useState } from "react";
import { createPortal } from "react-dom";
import { RatingStars, Textarea } from "../../components";
import Modal from "../shared/Modal";

export default function LeaveReviewComponent({
  isOpen,
  onClose,
  userProfile,
  onSubmitReview,
}) {
  const [rating, setRating] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // PLACEHOLDER: Mock data - replace with actual user profile from props/backend
  const mockUser = userProfile || {
    username: "nintendocicc",
    campus: "PUP Sta Mesa",
    department: "CCIS",
    profileImage: "https://picsum.photos/201/150",
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);

    const reviewData = {
      rating: rating,
      remarks: remarks.trim(),
      revieweeId: mockUser.id,
      reviewerId: "CURRENT_USER_ID",
      timestamp: new Date().toISOString(),
    };

    try {
      if (onSubmitReview) {
        await onSubmitReview(reviewData);
      } else {
        console.log("BACKEND TODO: Submit review data:", reviewData);
      }
      setRating(0);
      setRemarks("");
      setShowAlert(true); // Show alert modal
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setRating(0);
    setRemarks("");
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
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-[650px] w-full relative flex flex-col">
        {/* Back button */}
        <button
          onClick={onClose}
          className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-gray-700 transition-colors z-10"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        {/* Content Container */}
        <div className="flex flex-col items-center px-12 pt-16 pb-4 h-full">
          <h1 className="text-3xl font-bold text-[#950000] mb-8">
            Leave A Review
          </h1>

          {/* Profile Section */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="rounded-full overflow-hidden mb-4 border border-gray-200 flex items-center justify-center bg-gray-100"
              style={{ width: "135px", height: "135px" }}
            >
              <img
                src={mockUser.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {mockUser.username}
            </h2>
            <p className="text-gray-600 text-sm">
              {mockUser.campus} | {mockUser.department}
            </p>
          </div>

          {/* Rating Stars */}
          <div className="mb-6 flex justify-center items-center w-full">
            <RatingStars
              value={rating}
              onChange={setRating}
              size="large"
            />
          </div>

          {/* Remarks Section */}
          <div className="mb-8 w-full flex justify-center">
            <Textarea
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              maxLength={700}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between w-full mt-auto mb-2">
            <button
              onClick={handleSkip}
              className="text-primary-red hover:underline font-medium transition-colors bg-transparent border-none outline-none px-6 py-1.5"
            >
              Skip for now
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className={`bg-primary-red hover:bg-hover-red active:bg-[#b30000] disabled:bg-gray-400 text-white px-9 py-1.5 rounded-full font-medium transition-colors border-none outline-none`}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
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
