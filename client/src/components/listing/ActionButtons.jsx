import React from "react";

export default function ActionButtons({
  order,
  role,
  isUserPlaced,
  onCancelClick,
  onItemReceivedClick,
  onMarkCompleteClick,
  onLeaveReviewClick,
}) {
  const status = order.status?.toLowerCase();

  if (status === "cancelled") {
    return (
      <>
        <button
          className="text-gray-400 px-5 py-1.5 rounded-full cursor-not-allowed"
          disabled
        >
          Cancel Order
        </button>
        <button
          className="bg-gray-400 text-white px-5 py-1.5 rounded-full cursor-not-allowed"
          disabled
        >
          Order Cancelled
        </button>
      </>
    );
  }

  if (role === "user" && status === "ongoing") {
    return (
      <div className="flex justify-end w-full">
        <button
          className="bg-primary-red text-white px-5 py-1.5 rounded-full hover:bg-red-600 transition-colors"
          onClick={onItemReceivedClick}
        >
          Item Received
        </button>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="flex justify-end w-full">
        <button
          className="bg-primary-red text-white px-5 py-1.5 rounded-full hover:bg-red-600 transition-colors"
          onClick={onLeaveReviewClick}
        >
          Leave a Review
        </button>
      </div>
    );
  }

  if (role !== "user" && status === "ongoing") {
    return (
      <>
        <button
          className="text-primary-red hover:text-hover-red hover:font-semibold"
          onClick={onCancelClick}
        >
          Cancel Order
        </button>
        <button
          className="bg-primary-red text-white px-5 py-1.5 rounded-full hover:bg-red-600 transition-colors"
          onClick={onMarkCompleteClick}
        >
          Mark as Complete
        </button>
      </>
    );
  }

  if (role !== "user" && (status === "placed" || status === "order placed")) {
    return (
      <>
        <button className="text-primary-red hover:text-hover-red hover:font-semibold">
          Reject Order
        </button>
        <button className="bg-primary-red text-white px-5 py-1.5 rounded-full hover:bg-red-600 transition-colors">
          Accept Order
        </button>
      </>
    );
  }

  if (isUserPlaced) {
    return (
      <>
        <button className="text-primary-red hover:text-hover-red hover:font-semibold">
          Edit Details
        </button>
        <button
          className="bg-primary-red text-white px-5 py-1.5 rounded-full hover:bg-red-600 transition-colors"
          onClick={onCancelClick}
        >
          Cancel Order
        </button>
      </>
    );
  }

  return (
    <>
      <button className="text-primary-red hover:text-hover-red hover:font-semibold">
        Report Bogus
      </button>
      <button className="bg-primary-red text-white px-5 py-1.5 rounded-full hover:bg-red-600 transition-colors">
        Order Completed
      </button>
    </>
  );
}
