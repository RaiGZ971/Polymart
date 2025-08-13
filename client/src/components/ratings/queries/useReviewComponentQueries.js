import { useMutation } from '@tanstack/react-query';
import { ReviewService } from '../../../services/reviewService.js';

export const updateHelpfulCount = () => {
  return useMutation({
    mutationFn: ({ revieweeID, reviewID, form }) =>
      ReviewService.updateReview(revieweeID, reviewID, form),
  });
};

export const deleteHelpfulVoter = () => {
  return useMutation({
    mutationFn: ({ revieweeID, reviewID, userID }) =>
      ReviewService.deleteHelpfulVoter(revieweeID, reviewID, userID),
  });
};
