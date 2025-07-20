import React from "react";
import {
  ChevronRight,
} from "lucide-react"; 

// Emoji mapping for each notification type
const EMOJI_MAP = {
    "meetup": "📍",
  "listing-under-review": "⏳",
  "warning": "⚠️",
  "suspended": "⛔",
  "listing-approved": "✅",
  "message": "✉️",
  "order": "📦",
  "meetup-reported": "📍"
};

const NotificationOverlay = ({ notifications, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Blurred background */}
    <div
      className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm transition-colors"
      onClick={onClose}
    />
    {/* Notification panel */}
    <div className="relative bg-white rounded-[10px] shadow-lg w-[315px] h-[562px] p-6 z-10 flex flex-col" style={{fontFamily: 'Montserrat, ui-sans-serif'}}>
      <h2 className="mb-0.5 mt-2 px-4 font-bold text-left" style={{color:'#950000', fontFamily:'Montserrat, ui-sans-serif', fontSize:'20px', lineHeight:'1.2'}}>Notifications</h2>
      <hr className="border-[#950000] mx-auto" style={{width:'250.68px', marginTop:'2px', marginBottom:'13px'}} />
      <div className="space-y-4 overflow-y-auto flex-1">
        {notifications.map((notif, idx) => (
          <div key={idx} className="relative flex justify-center">
            {/* Red drop shadow effect outside the card on hover */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[245px] h-[calc(100%+12px)] rounded-[16px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-0"
                 style={{boxShadow: '0 0 16px 4px rgba(149,0,0,0.18)'}}></div>
            <div
              className="group bg-white border border-gray-300 rounded-lg px-4 py-3 flex flex-col cursor-pointer transition-shadow relative w-[233px] mx-auto z-10 items-center hover:shadow-[0_2px_5px_0_rgba(115,12,12,0.5)]"
              style={{ minHeight: 'auto' }}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-left" style={{fontFamily:'Montserrat, ui-sans-serif', fontSize:'12px'}}>
                  {(EMOJI_MAP[notif.type] || "🔔") + " "}{notif.title}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#950000] transition-colors duration-200" />
              </div>
              <div className="mb-1 w-full text-left" style={{fontFamily:'Montserrat, ui-sans-serif', fontSize:'8px', color:'#6b7280'}}>{notif.time}</div>
              <div className="text-left" style={{fontFamily:'Montserrat, ui-sans-serif', fontSize:'10px', color:'#1f2937'}}>{notif.message}</div>
              {notif.details && (
                <div className="mt-1 text-left" style={{fontFamily:'Montserrat, ui-sans-serif', fontSize:'10px', color:'#4b5563', whiteSpace:'pre-line'}}>{notif.details}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default NotificationOverlay;