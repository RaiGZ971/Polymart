import { useMutation, useQuery } from '@tanstack/react-query';
import { ReviewService } from '../../../services/reviewService.js';

export const postReview = () => {
  return useMutation({
    mutationFn: (form) => ReviewService.uploadReview(form),
  });
};

export const getReviewerProduct = (revieweeID, reviewerID, productID) => {
  return useQuery({
    queryKey: ['review', reviewerID, productID],
    queryFn: () =>
      ReviewService.getReviewerProduct(revieweeID, reviewerID, productID),
    enabled: !!revieweeID && !!reviewerID && !!productID,
  });
};
