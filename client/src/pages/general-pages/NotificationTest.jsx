import React, { useState } from "react";
import NotificationOverlay from "../../components/notifications/NotificationOverlay";

export default function NotificationTest() {
  const [showOverlay, setShowOverlay] = useState(true);

  // Sample notifications (replace for backend fetching)
  const notifications = [
    {
      type: "meetup",
      title: "Meet-Up Confirmed",
      time: "Just now",
      message: 'Your meet-up for "[Product Name]" has been confirmed by both parties.',
      details: "📅 Date: [Confirmed Date]\n⏰ Time: [Confirmed Time]\n📍 Location: [Confirmed Location]\nPlease arrive on time and bring your school ID for verification."
    },
    {
      type: "listing-under-review",
      title: "Listing Under Review",
      time: "Just now",
      message: "We've received your submission. Please allow 3–7 business days for approval."
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button
        className="p-2 bg-primary-red text-white rounded mb-4"
        onClick={() => setShowOverlay(true)}
      >
        Show Notifications
      </button>
      {showOverlay && (
        <NotificationOverlay
          notifications={notifications}
          onClose={() => setShowOverlay(false)}
        />
      )}
      <div className="text-gray-500 mt-8">This is a test page for NotificationOverlay.</div>
    </div>
  );
}