import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

// Emoji mapping for each notification type
const EMOJI_MAP = {
  meetup: '📍',
  'listing-under-review': '⏳',
  warning: '⚠️',
  suspended: '⛔',
  'listing-approved': '✅',
  message: '✉️',
  order: '📦',
  'meetup-reported': '📍',
  review: '📋',
  cancel: '❌',
};

// Individual notification item component
const NotificationItem = ({ notif, index }) => (
  <div key={index} className="relative flex justify-center px-4">
    {/* Hover shadow effect */}

    {/* Notification card */}
    <div className="group bg-white shadow-light rounded-lg p-4 flex flex-col cursor-pointer transition-shadow relative w-full mx-auto z-10 hover:shadow-glow">
      {/* Header with emoji, title and chevron */}
      <div className="flex items-center justify-between w-full text-left">
        <span className="font-semibold">
          {(EMOJI_MAP[notif.type] || '🔔') + ' '}
          {notif.title}
        </span>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#950000] transition-colors duration-200" />
      </div>

      {/* Timestamp */}
      <div className="mb-1 w-full text-left font-montserrat text-[10px] italic text-gray-500">
        {notif.time}
      </div>

      {/* Message */}
      <div className="w-full text-left font-montserrat text-xs text-gray-800">
        {notif.message}
      </div>

      {/* Optional details */}
      {notif.details && (
        <div className="mt-1 w-full text-left font-montserrat text-[10px] text-gray-600 whitespace-pre-line">
          {notif.details}
        </div>
      )}
    </div>
  </div>
);

// Main overlay component
const NotificationOverlay = ({ notifications, onClose }) => (
  <div className="bg-white rounded-[10px] shadow-light w-full h-screen py-6 flex flex-col font-montserrat">
    {/* Header */}
    <div className="bg-white py-6 relative items-center">
      <div className="flex items-center justify-center px-10">
        <div
          className="absolute left-6 text-gray-400 font-regular text-sm cursor-pointer hover:text-primary-red transition-colors"
          onClick={onClose}
        >
          <ChevronLeft size={24} className="inline" />
          Back
        </div>
        <span className="font-bold text-primary-red text-xl">
          Notifications
        </span>
      </div>
    </div>

    {/* Notifications list */}
    <div className="space-y-4 overflow-y-auto flex-1 px-1">
      {notifications.map((notif, idx) => (
        <NotificationItem key={idx} notif={notif} index={idx} />
      ))}
    </div>
  </div>
);

export default NotificationOverlay;
