import { useState } from 'react';
import { ReviewComponent } from '../../components';

export default function ReviewsSection({ reviews = [], order }) {
  const [showAllReviews, setShowAllReviews] = useState(false);

  return (
    <div className="w-1/2">
      <div className="flex flex-row items-end justify-between">
        <h1 className="font-bold text-3xl text-primary-red text-left">
          Reviews:
        </h1>
        <p className="text-gray-500 text-sm">
          {reviews ? reviews.length : 0} reviews |{' '}
          {order.sold_count || order.itemsOrdered || 0} items sold
        </p>
      </div>

      {/* Review Section */}
      <div className="mt-4 space-y-4">
        {reviews && reviews.length > 0 ? (
          <>
            {(showAllReviews ? reviews : reviews.slice(0, 6)).map(
              (review, idx) => (
                <ReviewComponent
                  key={idx}
                  review={review}
                  revieweeID={order.seller_id}
                />
              )
            )}
            {!showAllReviews && reviews.length > 5 && (
              <button
                className="text-primary-red font-semibold hover:underline mt-2"
                onClick={() => setShowAllReviews(true)}
              >
                See All
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-500">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
