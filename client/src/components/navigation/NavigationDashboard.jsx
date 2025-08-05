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
} from 'lucide-react';
import Logo from '../../assets/PolymartLogo.png';
import { useEffect, useState } from 'react';
import ChatApp from '../chat/ChatApp';
import NotificationOverlay from '../notifications/NotificationOverlay';
import CreateListingComponent from '../CreateListingComponent';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserNotification } from './queries/navigationQueries';
import { UserService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore.js';
import { AuthService } from "../../services/authService";

export default function NavigationDashboard({ onLogoClick, onHomeClick }) {
  const { currentUser: userID, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [firstName, setFirstName] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);

  // Get user's first name on component mount with caching
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = UserService.getCurrentUser(token);
        if (currentUser) {
          // Check if we have cached profile data
          const cachedProfile = sessionStorage.getItem('user_profile_cache');
          let cachedData = null;

          if (cachedProfile) {
            try {
              const parsed = JSON.parse(cachedProfile);
              const cacheAge = Date.now() - parsed.timestamp;
              // Use cache if it's less than 5 minutes old
              if (cacheAge < 5 * 60 * 1000) {
                cachedData = parsed;
              }
            } catch (err) {
              console.warn('Failed to parse cached profile:', err);
            }
          }

          if (cachedData) {
            // Use cached data
            setFirstName(cachedData.first_name || currentUser.username);
            setIsLoadingProfile(false);
            console.log(
              '🔄 Using cached profile data for:',
              cachedData.first_name
            );
          } else {
            // Fetch fresh data and cache it
            try {
              const profileResponse = await UserService.getMyProfile();
              if (profileResponse.success && profileResponse.data) {
                const firstName =
                  profileResponse.data.first_name || currentUser.username;
                setFirstName(firstName);

                // Cache the profile data
                const cacheData = {
                  first_name: firstName,
                  ...profileResponse.data,
                  timestamp: Date.now(),
                };
                sessionStorage.setItem(
                  'user_profile_cache',
                  JSON.stringify(cacheData)
                );
                console.log('📦 Cached fresh profile data for:', firstName);
              } else {
                // Fallback to username if profile fetch fails
                setFirstName(currentUser.username);
              }
              setIsLoadingProfile(false);
            } catch (profileError) {
              console.log(
                'Could not fetch profile, using username:',
                profileError
              );
              // Fallback to username if profile fetch fails
              setFirstName(currentUser.username);
              setIsLoadingProfile(false);
            }
          }
        } else {
          // User not authenticated, redirect to login
          navigate('/sign-in');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        navigate('/sign-in');
      }
    };

    loadUserData();
  }, [navigate]);

  // Sample notifications data - you can move this to a hook later
  // const notifications = [
  //   {
  //     type: "meetup",
  //     title: "Meetup Reminder",
  //     time: "2 hours ago",
  //     message: "Your meetup with @buyer123 is scheduled for tomorrow at 2 PM.",
  //     details: "Location: SM North EDSA\nProduct: Gaming Chair",
  //   },
  //   {
  //     type: "listing-approved",
  //     title: "Listing Approved",
  //     time: "5 hours ago",
  //     message: "Your listing 'Gaming Mouse' has been approved and is now live!",
  //   },
  //   {
  //     type: "message",
  //     title: "New Message",
  //     time: "1 day ago",
  //     message: "You have a new message from @seller456 about your order.",
  //   },
  // ];

  const {
    data: notifications = [],
    isLoading: notificationLoading,
    error: notificationError,
  } = getUserNotification(userID);

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
    { name: 'Customer Service', path: '/customer-service', icon: 'headphones' },
    { name: 'Help', path: '/help', icon: 'help' },
  ];

  const rightNavItems = [
    { name: 'Home', path: '/dashboard', icon: 'home' },
    {
      name: 'Create New Listing',
      path: '/',
      icon: 'plus',
      action: 'create-listing',
    },
    { name: 'Manage Listing', path: '/manage-listing', icon: 'box' },
    { name: 'Sign Out', path: '/', icon: 'logout' },
  ];

  const bottomNavItems = [
    { name: isLoadingProfile ? "Loading..." : (firstName || "User"), path: "/profile", icon: "user", hasText: true },
    {
      name: 'Orders & Meet Ups',
      path: '/orders-meetups',
      icon: 'map',
      hasText: true,
    },
    {
      name: 'Liked Items',
      path: '/liked-items',
      icon: 'heart',
      hasText: false,
    },
    {
      name: 'Notifications',
      path: '/',
      icon: 'bell',
      hasText: false,
      action: 'notifications',
    },
    {
      name: 'Messages',
      path: '/',
      icon: 'message',
      hasText: false,
      action: 'chat',
    },
  ];

  const handleItemClick = (item) => {
    if (item.action === 'chat') {
      setShowChat(true);
    } else if (item.action === 'notifications') {
      setShowNotifications(true);
    } else if (item.action === 'create-listing') {
      setShowCreateListing(true);
    } else if (item.name === "Sign Out") {
      handleLogout();
    } else if (item.name === "Home" && onHomeClick) {
      // Handle Home button click with refresh
      onHomeClick();
      navigate(item.path);
    } else {
      navigate(item.path);
    }
  };

  const handleLogout = () => {
    console.log('🚪 NavigationDashboard.handleLogout() called');
    
    // Clear authentication token via AuthService (this also clears cache)
    console.log('🔐 Calling AuthService.logout()...');
    AuthService.logout();
    
    console.log('🔄 Redirecting to sign-in...');
    // Redirect to sign-in page
    navigate('/sign-in');
    
    console.log('✅ NavigationDashboard.handleLogout() completed');
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
    // Call the refresh function if provided
    if (onLogoClick) {
      onLogoClick();
    }
    // Navigate to dashboard like the Home button does
    navigate('/dashboard');
  };

  // Helper to check if nav item is active
  const isActive = (item) => {
    // For demo, match by path (customize as needed)
    return item.path !== '/' && location.pathname.startsWith(item.path);
  };

  return (
    <div>
      {/* Red Navigation Bar */}
      <div className="bg-secondary-red z-40">
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
            className="min-w-[148px] max-w-[148px] min-h-[50px] max-h-[50px] mx-4 cursor-pointer hover:opacity-80 transition-opacity duration-200"
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
                  item.hasText ? 'flex items-center gap-2' : ''
                } ${active ? 'text-primary-red font-bold' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <IconComponent
                  size={22}
                  className={`group-hover:text-hover-red transition-colors duration-200 ${
                    active ? 'text-primary-red' : 'text-gray-800'
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
              animation: 'fadeScaleIn 0.3s cubic-bezier(0.4,0,0.2,1)',
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
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Background overlay */}
        <div className="absolute inset-0" onClick={handleCloseChat} />

        {/* Chat panel sliding from right */}
        <div
          className={`absolute right-0 top-0 h-full w-[30%] bg-white shadow-2xl transition-transform duration-500 ease-in-out rounded-tl-2xl rounded-bl-2xl ${
            showChat ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <ChatApp onClose={handleCloseChat} />
        </div>
      </div>

      {/* Notifications Slide-in Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          showNotifications
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 " onClick={handleCloseNotifications} />

        {/* Notifications panel sliding from right */}
        <div
          className={`absolute right-0 top-0 h-full w-[30%] bg-white shadow-2xl transition-transform duration-500 ease-in-out rounded-tl-2xl rounded-bl-2xl flex items-center justify-center ${
            showNotifications ? 'translate-x-0' : 'translate-x-full'
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
