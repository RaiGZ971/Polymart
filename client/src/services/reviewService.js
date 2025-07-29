import { ApiClient } from "./apiClient.js";

export class ReviewService{

    static async getReview(revieweeID, reviewID){
        return ApiClient.get(`dynamodb/review/${revieweeID}/${reviewID}`);
    }

    static async getProductReview(revieweeID, productID){
        return ApiClient.get(`dynamodb/product-review/${revieweeID}/${productID}`);
    }

    static async getSellerReview(revieweeID){
        return ApiClient.get(`dynamodb/seller-review/${revieweeID}`);
    }

    static async uploadReview(form){
        return ApiClient.post(`dynamodb/review`, form);
    }

    static async deleteReviewImage(revieweeID, reviewID, image){
        return ApiClient.deleteData(`dynamodb/review-image/${revieweeID}/${reviewID}`, image)
    }
}