import { API_BASE } from '@/config/api.js';
import { ApiClient } from './apiClient.js';

export class ReviewService {
  static async getReview(revieweeID, reviewID) {
    return ApiClient.get(`/dynamodb/review/${revieweeID}/${reviewID}`);
  }

  static async getReviewerProduct(revieweeID, reviewerID, productID) {
    return ApiClient.get(
      `/dynamodb/product-reviewee-reviewer/${revieweeID}/${reviewerID}/${productID}`
    );
  }

  static async getProductReview(revieweeID, productID) {
    return ApiClient.get(`/dynamodb/product-review/${revieweeID}/${productID}`);
  }

  static async getSellerReview(revieweeID) {
    return ApiClient.get(`/dynamodb/seller-review/${revieweeID}`);
  }

  static async uploadReview(form) {
    return ApiClient.post(`/dynamodb/review`, form);
  }

  static async updateReview(revieweeID, reviewID, form) {
    return ApiClient.put(`/dynamodb/review/${revieweeID}/${reviewID}`, form);
  }

  static async deleteReview(revieweeID, reviewID) {
    return ApiClient.delete(`/dynamodb/review/${revieweeID}/${reviewID}`);
  }

  static async deleteHelpfulVoter(revieweeID, reviewID, userID) {
    return ApiClient.delete(
      `/dynamodb/review-helpful/${revieweeID}/${reviewID}/${userID}`
    );
  }

  static async deleteReviewImage(revieweeID, reviewID, image) {
    return ApiClient.deleteData(
      `/dynamodb/review-image/${revieweeID}/${reviewID}`,
      image
    );
  }

  static async deleteReviewImages(revieweeID, reviewID, images) {
    return ApiClient.deleteData(
      `/dynamodb/review-images/${revieweeID}/${reviewID}`,
      images
    );
  }

  static async uploadReviewImagesBucket(revieweeID, images) {
    const formData = new FormData();

    images.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch(`${API_BASE}/s3/review/${revieweeID}`, {
      method: `POST`,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload images: ${response.statusText}`);
    }

    return response.json();
  }

  static async deleteReviewImageBucket(image) {
    return ApiClient.delete(`/s3/review-image`, image);
  }

  static async deleteReviewImagesBucket(images) {
    return ApiClient.delete(`/s3/review-images`, images);
  }
}
