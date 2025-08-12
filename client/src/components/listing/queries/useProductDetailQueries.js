import { useMutation } from '@tanstack/react-query';
import { ReviewService } from '../../../services/reviewService.js';

export const postReview = () => {
  return useMutation({
    mutationFn: (form) => ReviewService.uploadReview(form),
  });
};
