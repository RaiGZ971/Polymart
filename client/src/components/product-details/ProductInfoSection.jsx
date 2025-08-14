// ProductDetailsSection - Handles the right side product information and user actions
import { Flag } from 'lucide-react';
import {
  StaticRatingStars,
  QuantityPicker,
  FavoriteButton,
} from '../../components';
import productCategories from '../../data/productCategories';

const getCategoryLabel = (value) => {
  const found = productCategories.find((cat) => cat.value === value);
  return found ? found.label : value;
};

export default function ProductInfoSection({
  order,
  quantity,
  onQuantityChange,
  averageRating,
  hasPendingOrder,
  pendingOrderLoading,
  onPlaceOrderClick,
}) {
  return (
    <div className="w-1/2 text-left space-y-5">
      <div className="flex flex-col gap-2">
        {/* Title & Category */}
        <div>
          <div className="flex flex-row justify-between">
            <p className="text-primary-red text-base">
              {getCategoryLabel(order.category)}
            </p>
            <button className="text-sm group hover:text-primary-red hover:underline">
              <Flag
                size={20}
                className="inline pr-1 group-hover:text-primary-red"
              />
              Report
            </button>
          </div>
          <h1 className="text-4xl flex flex-wrap font-bold">
            {order.productName || order.name}
          </h1>
        </div>

        {/* Price & Average Rating */}
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-3xl font-bold text-primary-red">
            {order.hasPriceRange && order.priceRange
              ? `PHP ${order.priceRange.min} - PHP ${order.priceRange.max}`
              : `PHP ${order.productPrice}`}
          </h2>
          <div className="flex flex-col items-end">
            <StaticRatingStars value={averageRating} />
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {averageRating} stars |{' '}
              {order.sold_count || order.itemsOrdered || 0} reviews
            </p>
          </div>
        </div>

        {/* Product Description */}
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-primary-red">
            Product Description
          </p>
          <p className="text-sm text-gray-800">
            {order.productDescription ||
              order.description ||
              'No description provided.'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Availability */}
        <div className="flex flex-row gap-1 text-base">
          <p className="font-semibold text-primary-red">Availability:</p>
          <p className="text-gray-800">
            {order.stock || order.total_stock || 0} in stock
          </p>
        </div>

        {/* Quantity Picker */}
        <div className="flex flex-row gap-2 text-base">
          <p className="font-semibold text-primary-red">Item Quantity:</p>
          <QuantityPicker
            value={quantity}
            min={1}
            max={order.stock || order.total_stock || 1}
            onChange={onQuantityChange}
          />
        </div>
      </div>

      {/* Place Order Button */}
      <button
        className={`px-4 py-2 rounded-full border-2 font-bold w-full transition-colors ${
          hasPendingOrder || pendingOrderLoading
            ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
            : 'hover:bg-primary-red hover:text-white bg-white border-primary-red text-primary-red'
        }`}
        onClick={onPlaceOrderClick}
        disabled={hasPendingOrder || pendingOrderLoading}
      >
        {pendingOrderLoading
          ? 'Checking...'
          : hasPendingOrder
          ? 'Pending Order'
          : 'Place Order'}
      </button>

      {/* Pending Order Notice */}
      {hasPendingOrder && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have a pending order for this product.
                <button
                  className="underline ml-1 hover:text-yellow-800"
                  onClick={() => window.location.href = '/orders'}
                >
                  View your orders
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Favorite Button */}
      <div className="flex flex-row gap-4 items-center">
        <FavoriteButton
          listingId={order.listing_id || order.id}
          className="text-sm group hover:text-primary-red hover:underline"
          size={20}
          showText={true}
        />
      </div>
    </div>
  );
}
