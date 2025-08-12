export const formattedReview = (review, order, type) => {
  let response = {
    reviewer_id: review.reviewerId,
    reviewee_id: review.revieweeId,
    reviewer_type: type,
    rating: review.rating,
    description: review.remarks,
  };

  if (type === 'Product') {
    response.product_id = order.productID;
    response.order_id = order.orderID;
  }

  return response;
};
