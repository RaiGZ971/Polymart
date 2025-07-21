import { useState } from "react";
import RatingStars from "../shared/RatingStars";

export default function LeaveReviewComponent({ isOpen, onClose, userProfile, onSubmitReview }) {
  const [rating, setRating] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PLACEHOLDER: Mock data - replace with actual user profile from props/backend
  const mockUser = userProfile || {
    username: "nintendocicc", // PLACEHOLDER: Replace with actual username from backend
    campus: "PUP Sta Mesa", // PLACEHOLDER: Replace with actual campus from backend
    department: "CCIS", // PLACEHOLDER: Replace with actual department from backend
    profileImage: "https://picsum.photos/201/150" // PLACEHOLDER: Replace with actual profile image URL from backend
  };

  const handleSubmit = async () => {
    if (rating === 0) return; // Prevent submission without rating
    
    setIsSubmitting(true);
    
    // BACKEND INTEGRATION POINT: Prepare review data for backend submission
    const reviewData = {
      rating: rating, // Star rating (1-5)
      remarks: remarks.trim(), // Optional review text
      revieweeId: mockUser.id, // PLACEHOLDER: Add actual user ID being reviewed
      reviewerId: "CURRENT_USER_ID", // PLACEHOLDER: Replace with actual current user ID from auth
      timestamp: new Date().toISOString(), // Review submission timestamp
      // Add other required fields as needed by backend API
    };

    try {
      // BACKEND INTEGRATION POINT: Replace this with actual API call
      if (onSubmitReview) {
        await onSubmitReview(reviewData);
      } else {
        // PLACEHOLDER: Replace with actual backend API call
        console.log("BACKEND TODO: Submit review data:", reviewData);
        // Example: await api.submitReview(reviewData);
      }

      // Reset form and close modal on successful submission
      setRating(0);
      setRemarks("");
      onClose && onClose();
    } catch (error) {
      // BACKEND INTEGRATION POINT: Handle submission errors
      console.error("Failed to submit review:", error);
      // TODO: Add error handling UI (toast, alert, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setRating(0);
    setRemarks("");
    onClose && onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-12 py-8">
      <style>{`
        .leave-review-stars {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .leave-review-stars > div {
          display: flex;
          justify-content: center;
        }
        .leave-review-stars span {
          font-size: 3rem !important;
          height: 3rem !important;
          width: 3rem !important;
        }
        .leave-review-textarea::-webkit-scrollbar {
          width: 6px;
        }
        .leave-review-textarea::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 6px;
        }
        .leave-review-textarea {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db #f3f4f6;
        }
        .leave-review-red {
          color: #950000 !important;
        }
        .leave-review-bg-red {
          background-color: #950000 !important;
        }
        .leave-review-bg-red-hover:hover {
          background-color: #7a0000 !important;
        }
        .leave-review-bg-red-active:active {
          background-color: #b30000 !important;
        }
      `}</style>
      
      <div 
        className="bg-white shadow-2xl relative flex flex-col"
        style={{ 
          width: '641.25px', 
          height: '674.75px', 
          boxShadow: '0 8px 32px 0 rgba(60,60,60,0.18)',
          borderRadius: '15px'
        }}
      >
        {/* Back button */}
        <button 
          onClick={onClose}
          className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-gray-700 transition-colors z-10"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Content Container */}
        <div className="flex flex-col items-center px-12 pt-24 pb-12 h-full">
          <h1 className="text-3xl font-bold leave-review-red mb-6">Leave A Review</h1>

          {/* Profile Section */}
          <div className="flex flex-col items-center mb-6">
            <div 
              className="rounded-full overflow-hidden mb-4 border border-gray-200 flex items-center justify-center bg-gray-100"
              style={{ width: '135px', height: '135px' }}
            >
              <img 
                src={mockUser.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{mockUser.username}</h2>
            <p className="text-gray-600 text-sm">{mockUser.campus} | {mockUser.department}</p>
          </div>

          {/* Rating Stars */}
          <div className="mb-6 leave-review-stars w-full">
            <RatingStars 
              value={rating} 
              onChange={setRating}
            />
          </div>

          {/* Remarks Section */}
          <div className="mb-2 w-full flex justify-center">
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="(Optional) Leave a remark..."
              className="leave-review-textarea border border-gray-300 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#950000] focus:border-transparent"
              style={{ width: '435px', height: '113px' }}
              maxLength={700}
            />
          </div>

          {/* Character count */}
          <div className="text-sm text-gray-500 mb-8 w-full flex justify-center">
            <div style={{ width: '435px' }} className="text-left">
              {remarks.length}/700 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between w-full mt-auto">
            <button
              onClick={handleSkip}
              className="leave-review-red hover:underline font-medium transition-colors bg-transparent border-none outline-none px-6 py-1.5"
            >
              Skip for now
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="leave-review-bg-red leave-review-bg-red-hover leave-review-bg-red-active disabled:bg-gray-400 text-white px-9 py-1.5 rounded-full font-medium transition-colors border-none outline-none"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
