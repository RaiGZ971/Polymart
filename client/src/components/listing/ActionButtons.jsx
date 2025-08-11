import React from "react";

import { Button } from "@/components";

export default function ActionButtons({
  order,
  role,
  isUserPlaced,
  onCancelClick,
  onMarkCompleteClick,
  onLeaveReviewClick,
  onAcceptOrder,
  onRejectOrder,
}) {
  const status = order.status?.toLowerCase();
  const isBuyer = role === "user";
  const isSeller = role === "owner" || role === "seller";

  // Cancelled orders - both buyer and seller see disabled buttons
  if (status === "cancelled") {
    return (
      <>
        <Button variant="graytext" disabled>
          Cancel Order
        </Button>
        <Button
          className="bg-gray-400 text-white px-5 py-1.5 rounded-full cursor-not-allowed"
          disabled
        >
          Order Cancelled
        </Button>
      </>
    );
  }

  // Completed orders - both buyer and seller can leave reviews
  if (status === "completed") {
    return (
      <div className="flex justify-end w-full">
        <Button variant="primary" onClick={onLeaveReviewClick}>
          Leave a Review
        </Button>
      </div>
    );
  }

  // Pending orders - seller can confirm/reject, buyer can cancel
  if (status === "pending") {
    if (isSeller) {
      return (
        <>
          <Button variant="graytext" onClick={onRejectOrder}>
            Reject Order
          </Button>
          <Button variant="primary" onClick={onAcceptOrder}>
            Confirm Order
          </Button>
        </>
      );
    } else if (isBuyer) {
      return (
        <>
          <Button variant="graytext" onClick={onCancelClick}>
            Cancel Order
          </Button>
          <Button variant="primary" disabled className="bg-gray-400 text-white cursor-not-allowed">
            Waiting for Confirmation
          </Button>
        </>
      );
    }
  }

  // Confirmed orders - seller can mark complete, buyer can only cancel or wait
  if (status === "confirmed") {
    if (isSeller) {
      return (
        <>
          <Button variant="graytext" onClick={onCancelClick}>
            Cancel Order
          </Button>
          <Button variant="primary" onClick={onMarkCompleteClick}>
            Mark as Complete
          </Button>
        </>
      );
    } else if (isBuyer) {
      return (
        <>
          <Button variant="graytext" onClick={onCancelClick}>
            Cancel Order
          </Button>
          <Button variant="primary" disabled className="bg-gray-400 text-white cursor-not-allowed">
            Waiting for Completion
          </Button>
        </>
      );
    }
  }

  // Fallback for any unhandled status
  return (
    <>
      <Button variant="graytext" onClick={onCancelClick}>
        Cancel Order
      </Button>
      <Button variant="primary" disabled className="bg-gray-400 text-white cursor-not-allowed">
        Unknown Status
      </Button>
    </>
  );
}
