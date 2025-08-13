import { useState } from 'react';
import { CalendarViewer, GrayTag } from '../../components';
import { stallbanner, pupmap } from '../../assets';
import timeSlots from '../../data/timeSlots';

export default function SellerInfoSection({
  order,
  onMessageClick,
  onMapClick,
}) {
  // Helper to generate value for CalendarViewer from order.availableSchedules
  const getCalendarValue = (order) => {
    // Handle both snake_case (from API) and camelCase (from sample data)
    const schedules = order?.available_schedules || order?.availableSchedules;
    if (!schedules) return [];
    return schedules.flatMap((sched) =>
      (sched.times || []).map((time) => [sched.date, time])
    );
  };

  // Check if transaction includes meet-up
  const transactionMethods = order.transactionMethods || order.transaction_methods || [];
  const hasMeetup = transactionMethods.includes('Meet-up');
  const hasOnline = transactionMethods.includes('Online');

  return (
    <div className="w-1/2">
      {/* Seller */}
      <div className="flex flex-row items-start justify-between">
        <div className="flex flex-row items-center gap-4">
          <div className="relative flex flex-col items-center w-20 h-20">
            {/* Stall Banner Overlay */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-12 overflow-hidden z-10 flex justify-center">
              <img
                src={stallbanner}
                alt="Stall Banner"
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
              />
            </div>
            {/* User Image */}
            <img
              src={order.userAvatar || 'https://picsum.photos/247/245'}
              alt="User Image"
              className="w-full h-full rounded-full object-cover z-0"
            />
          </div>
          <div className="text-left pl-3">
            <p className="font-bold text-lg">
              {order.username || 'Unknown Seller'}
            </p>
            <p className="text-gray-500 text-sm">PUP Sta Mesa | CCIS</p>
            <p className="text-xs text-gray-800 mt-2">
              {order.seller_listing_count || 0} Active Listings |{' '}
              <span className="text-yellow-400">★</span> 4.5 stars
            </p>
          </div>
        </div>
        <div>
          <button
            className="bg-primary-red font-semibold text-white px-4 py-2 rounded-lg hover:bg-hover-red transition-colors text-sm"
            onClick={onMessageClick}
          >
            Message
          </button>
        </div>
      </div>

      {/* Transaction Types */}
      <div className="flex flex-col text-left mt-10">
        <h1 className="text-primary-red font-semibold text-base">
          Transaction Types
        </h1>
        <p className="text-sm text-gray-500">
          Available transaction methods for this listing
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {transactionMethods.length > 0 ? (
            transactionMethods.map((method, idx) => (
              <GrayTag key={idx} text={method} />
            ))
          ) : (
            <GrayTag text="No transaction methods listed" />
          )}
        </div>
      </div>

      {/* Meet Up Details - Only show if Meet-up is included in transaction methods */}
      {hasMeetup && (
        <>
          {/* Map */}
          <div className="flex flex-col text-left mt-10">
            <h1 className="text-2xl font-bold text-primary-red">
              Meet Up Details
            </h1>
            <button
              className="focus:outline-none"
              onClick={onMapClick}
              aria-label="View PUP Map"
            >
              <img
                src={pupmap}
                alt="PUP Map"
                className="w-full h-full rounded-2xl object-cover mt-4 hover:brightness-90 transition"
              />
            </button>
          </div>

          {/* Meet Up Locations */}
          <div className="flex flex-col text-left mt-10">
            <h1 className="text-primary-red font-semibold text-base">
              Available Meet Up Locations
            </h1>
            <p className="text-sm text-gray-500">
              Seller's available meet-up locations are listed below
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {order.meetupLocations || order.seller_meetup_locations ? (
                (order.meetupLocations || order.seller_meetup_locations).map(
                  (loc, idx) => <GrayTag key={idx} text={loc} />
                )
              ) : (
                <GrayTag text="No locations listed" />
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="flex flex-col text-left mt-10">
            <h1 className="text-primary-red font-semibold text-base">
              Available Meet Up Schedules
            </h1>
            <p className="text-sm text-gray-500">
              Seller's available time and dates for meet-ups are listed below
            </p>
            <div className="mt-4">
              <CalendarViewer
                label="Meet-up Schedule"
                value={getCalendarValue(order)}
                timeSlots={timeSlots}
              />
            </div>
          </div>
        </>
      )}

      {/* Payment Method */}
      <div className="flex flex-col text-left mt-10">
        <h1 className="text-primary-red font-semibold text-base">
          Available Payment Methods
        </h1>
        <p className="text-sm text-gray-500">
          {hasMeetup && hasOnline
            ? 'Payment methods vary by transaction type (meet-up or online)'
            : hasMeetup
            ? 'All payment transactions are made during meet-ups'
            : 'Online payment methods available'}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {order.paymentMethods || order.payment_methods ? (
            (order.paymentMethods || order.payment_methods).map(
              (method, idx) => <GrayTag key={idx} text={method} />
            )
          ) : (
            <GrayTag text="No payment methods listed" />
          )}
        </div>
      </div>
    </div>
  );
}
