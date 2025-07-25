import React from "react";

import { Button } from "@/components";

export default function ActionButtons({
  order,
  role,
  isUserPlaced,
  onCancelClick,
  onItemReceivedClick,
  onMarkCompleteClick,
  onLeaveReviewClick,
  onAcceptOrder,
  onRejectOrder,
}) {
  const status = order.status?.toLowerCase();

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

  if (role === "user" && status === "ongoing") {
    return (
      <div className="flex justify-end w-full">
        <Button variant="primary" onClick={onItemReceivedClick}>
          Item Received
        </Button>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="flex justify-end w-full">
        <Button variant="primary" onClick={onLeaveReviewClick}>
          Leave a Review
        </Button>
      </div>
    );
  }

  if (role !== "user" && status === "ongoing") {
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
  }

  if (role !== "user" && (status === "placed" || status === "order placed")) {
    return (
      <>
        <Button variant="graytext" onClick={onRejectOrder}>
          Reject Order
        </Button>
        <Button variant="primary" onClick={onAcceptOrder}>
          Accept Order
        </Button>
      </>
    );
  }

  if (isUserPlaced) {
    return (
      <>
        <Button variant="graytext">Edit Details</Button>
        <Button variant="primary" onClick={onCancelClick}>
          Cancel Order
        </Button>
      </>
    );
  }

  return (
    <>
      <Button variant="graytext">Report Bogus</Button>
      <Button variant="primary">Order Completed</Button>
    </>
  );
}
