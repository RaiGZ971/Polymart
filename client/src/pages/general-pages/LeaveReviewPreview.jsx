import { useState } from "react";
import LeaveReviewComponent from "../../components/reviews/LeaveReviewComponent";

export default function LeaveReviewPreview() {
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Leave Review Component Preview</h1>
        <button
          onClick={() => setIsReviewOpen(true)}
          className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-lg font-medium transition-colors mb-8"
        >
          Open Leave Review Modal
        </button>
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600 mb-4">
            This is sample background content to demonstrate how the modal overlay appears over the existing page content with proper visual separation.
          </p>
        </div>
      </div>
      <LeaveReviewComponent isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} />
    </div>
  );
}
