import { TimeAgo } from './timeAgo.js';

export const formattedReviews = (reviews) => {
  let responses = [];

  reviews.forEach((review) => {
    responses.push({
      reviewID: review.review_id,
      user: {
        userID: review.reviewer_id,
      },
      date: TimeAgo(review.created_at),
      content: review.description,
      rating: review.rating,
      images: review.images,
      helpfulCount: review.voted_as_helpful,
    });
  });

  return responses;
};
