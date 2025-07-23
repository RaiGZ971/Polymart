import {
  Home,
  Plus,
  Archive,
  LogOut,
  HeadphonesIcon,
  HelpCircle,
  MapPinned,
  CircleUserRound,
  Bell,
  MessageCircle,
  Heart,
} from "lucide-react";
import Logo from "../../assets/PolymartLogo.png";
import { useState } from "react";
import ChatApp from "../chat/ChatApp";
import NotificationOverlay from "../notifications/NotificationOverlay";
import CreateListingComponent from "../CreateListingComponent";
import { useNavigate, useLocation } from "react-router-dom";

export default function NavigationDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const firstName = "Jianna";
  const [showChat, setShowChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);

  // Sample notifications data - you can move this to a hook later
  const notifications = [
    {
      type: "meetup",
      title: "Meetup Reminder",
      time: "2 hours ago",
      message: "Your meetup with @buyer123 is scheduled for tomorrow at 2 PM.",
      details: "Location: SM North EDSA\nProduct: Gaming Chair",
    },
    {
      type: "listing-approved",
      title: "Listing Approved",
      time: "5 hours ago",
      message: "Your listing 'Gaming Mouse' has been approved and is now live!",
    },
    {
      type: "message",
      title: "New Message",
      time: "1 day ago",
      message: "You have a new message from @seller456 about your order.",
    },
  ];

  const iconMap = {
    home: Home,
    plus: Plus,
    box: Archive,
    logout: LogOut,
    headphones: HeadphonesIcon,
    help: HelpCircle,
    user: CircleUserRound,
    map: MapPinned,
    bell: Bell,
    message: MessageCircle,
    heart: Heart,
  };

  const leftNavItems = [
    { name: "Customer Service", path: "/", icon: "headphones" },
    { name: "Help", path: "/", icon: "help" },
  ];

  const rightNavItems = [
    { name: "Home", path: "/dashboard", icon: "home" },
    {
      name: "Create New Listing",
      path: "/",
      icon: "plus",
      action: "create-listing",
    },
    { name: "Manage Listing", path: "/", icon: "box" },
    { name: "Sign Out", path: "/", icon: "logout" },
  ];

  const bottomNavItems = [
    { name: firstName, path: "/", icon: "user", hasText: true },
    {
      name: "Orders & Meet Ups",
      path: "/orders-meetups",
      icon: "map",
      hasText: true,
    },
    {
      name: "Liked Items",
      path: "/liked-items",
      icon: "heart",
      hasText: false,
    },
    {
      name: "Notifications",
      path: "/",
      icon: "bell",
      hasText: false,
      action: "notifications",
    },
    {
      name: "Messages",
      path: "/",
      icon: "message",
      hasText: false,
      action: "chat",
    },
  ];

  const handleItemClick = (item) => {
    if (item.action === "chat") {
      setShowChat(true);
    } else if (item.action === "notifications") {
      setShowNotifications(true);
    } else if (item.action === "create-listing") {
      setShowCreateListing(true);
    } else {
      navigate(item.path);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const handleCloseCreateListing = () => {
    setShowCreateListing(false);
  };

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else if (variant === "landing") {
      const homeElement = document.getElementById("home");
      if (homeElement) {
        homeElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      window.location.href = "/";
    }
  };

  // Helper to check if nav item is active
  const isActive = (item) => {
    // For demo, match by path (customize as needed)
    return item.path !== "/" && location.pathname.startsWith(item.path);
  };

  return (
    <div>
      {/* Red Navigation Bar */}
      <div className="bg-secondary-red">
        <div className="text-white text-xs py-2 px-12 flex justify-between">
          {/* Left side - Customer Service and Help */}
          <div className="flex items-center">
            {leftNavItems.map((item, index) => {
              const IconComponent = iconMap[item.icon];
              return (
                <div key={index} className="flex items-center">
                  <a
                    href={item.path}
                    className="hover:underline hover:text-gray-200 transition-colors duration-200 inline-flex items-center gap-1"
                  >
                    {IconComponent && <IconComponent size={14} />}
                    {item.name}
                  </a>
                  {index < leftNavItems.length - 1 && (
                    <span className="mx-3">|</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right side - Home, Create, Manage, Sign Out */}
          <div className="flex items-center">
            {rightNavItems.map((item, index) => {
              const IconComponent = iconMap[item.icon];
              return (
                <div key={index} className="flex items-center">
                  {item.action ? (
                    <button
                      onClick={() => handleItemClick(item)}
                      className="hover:underline hover:text-gray-200 transition-colors duration-200 inline-flex items-center gap-1"
                    >
                      {IconComponent && <IconComponent size={14} />}
                      {item.name}
                    </button>
                  ) : (
                    <a
                      href={item.path}
                      className="hover:underline hover:text-gray-200 transition-colors duration-200 inline-flex items-center gap-1"
                    >
                      {IconComponent && <IconComponent size={14} />}
                      {item.name}
                    </a>
                  )}
                  {index < rightNavItems.length - 1 && (
                    <span className="mx-3">|</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logo + Navigation Section */}
      <div className="pl-24 pr-24 pt-8 w-full justify-between flex items-center text-sm">
        <div>
          <img
            src={Logo}
            alt="Polymart Logo"
            className="min-w-[148px] max-w-[148px] min-h-[50px] max-h-[50px] mx-4"
            onClick={handleLogoClick}
          />
        </div>
        <div className="flex items-center gap-4">
          {bottomNavItems.map((item, index) => {
            const IconComponent = iconMap[item.icon];
            const active = isActive(item);
            return (
              <div
                key={index}
                className={`cursor-pointer group hover:text-hover-red transition-colors duration-200 ${
                  item.hasText ? "flex items-center gap-2" : ""
                } ${active ? "text-primary-red font-bold" : ""}`}
                onClick={() => handleItemClick(item)}
              >
                <IconComponent
                  size={28}
                  className={`group-hover:text-hover-red transition-colors duration-200 ${
                    active ? "text-primary-red" : "text-gray-800"
                  }`}
                />
                {item.hasText && item.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Listing Popup */}
      {showCreateListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Background overlay with fade-in */}
          <div
            className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300"
            onClick={handleCloseCreateListing}
          />
          {/* Popup content with scale and fade animation */}
          <div
            className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg
                            transition-all duration-300
                            animate-in
                            animate-fade-in
                            animate-scale-in"
            style={{
              animation: "fadeScaleIn 0.3s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <CreateListingComponent onClose={handleCloseCreateListing} />
          </div>
        </div>
      )}

      {/* Chat Slide-in Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          showChat
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Background overlay */}
        <div className="absolute inset-0" onClick={handleCloseChat} />

        {/* Chat panel sliding from right */}
        <div
          className={`absolute right-0 top-0 h-full w-[30%] bg-white shadow-2xl transition-transform duration-500 ease-in-out rounded-tl-2xl rounded-bl-2xl ${
            showChat ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <ChatApp onClose={handleCloseChat} />
        </div>
      </div>

      {/* Notifications Slide-in Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          showNotifications
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 " onClick={handleCloseNotifications} />

        {/* Notifications panel sliding from right */}
        <div
          className={`absolute right-0 top-0 h-full w-[30%] bg-white shadow-2xl transition-transform duration-500 ease-in-out rounded-tl-2xl rounded-bl-2xl flex items-center justify-center ${
            showNotifications ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <NotificationOverlay
            notifications={notifications}
            onClose={handleCloseNotifications}
          />
        </div>
      </div>
    </div>
  );
}
