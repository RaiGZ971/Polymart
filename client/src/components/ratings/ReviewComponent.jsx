import { useState } from 'react';
import { StaticRatingStars } from '@/components';
import { ThumbsUp } from 'lucide-react';
import {
  updateHelpfulCount,
  deleteHelpfulVoter,
} from './queries/useReviewComponentQueries.js';
import { useAuthStore } from '../../store/authStore.js';

export default function ReviewComponent({ review, revieweeID }) {
  const userID = useAuthStore.getState().userID;
  const isVoted = review.helpfulCount?.includes(userID);

  const [rating, setRating] = useState(review.rating);
  const [helpful, setHelpful] = useState(isVoted);
  const [helpfulCount, setHelpfulCount] = useState(
    review.helpfulCount?.length || 0
  );

  const { mutate: appendHelpfulCount } = updateHelpfulCount();
  const { mutate: removeHelpfulVoter } = deleteHelpfulVoter();

  const handleHelpfulClick = () => {
    if (!helpful) {
      appendHelpfulCount(
        {
          revieweeID,
          reviewID: review.reviewID,
          form: { voted_as_helpful: userID },
        },
        {
          onSuccess: (data) => {
            console.log('Added to helpful voters: ', data);
          },
        }
      );

      setHelpful(true);
      setHelpfulCount((count) => count + 1);
    } else {
      removeHelpfulVoter(
        {
          revieweeID,
          reviewID: review.reviewID,
          userID: userID,
        },
        {
          onSuccess: (data) => {
            console.log('Removed to helpful voters: ', data);
          },
        }
      );

      setHelpful(false);
      setHelpfulCount((count) => count - 1);
    }
  };

  return (
    <div className="flex flex-col shadow-glow p-4 rounded-xl space-y-4">
      <div className="flex flex-row items-center gap-2 mt-2">
        {/* User Avatar */}
        <div>
          <img
            src={review.user.avatar}
            alt="User Avatar"
            className="opacity-60 w-8 h-8 rounded-full"
          />
        </div>
        {/* User Name */}
        <div className="text-left">
          <div className="flex flex-row gap-1 text-xs items-center">
            <p className="text-xs font-semibold text-gray-800">
              {review.user.name}
            </p>
            <span>says:</span>
          </div>
          <p className="text-[10px] italic text-gray-400">{review.date}</p>
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-600 text-left">{review.content}</p>
      </div>
      {/* Rating Stars */}

      <div className="flex flex-row items-start gap-2 mt-6 justify-between">
        <div className="flex flex-row gap-3 items-center">
          <StaticRatingStars value={rating} />
          <p className="text-xs text-gray-400 mt-2 italic">{rating}/5 stars</p>
        </div>
        <div className="flex flex-col text-right">
          <p
            className={`text-xs font-semibold cursor-pointer hover:underline ${
              helpful ? 'text-primary-red' : 'text-gray-800'
            }`}
            onClick={handleHelpfulClick}
          >
            <ThumbsUp
              className={`w-4 h-4 inline mr-1 -mt-1 ${
                helpful ? 'text-primary-red' : 'text-gray-600'
              }`}
            />
            {helpful ? 'Marked as Helpful' : 'Mark as Helpful'}
          </p>
          <p className="text-xs text-gray-400">
            ({helpfulCount} PUPians found this helpful)
          </p>
        </div>
      </div>
    </div>
  );
}
