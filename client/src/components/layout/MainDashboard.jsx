import { NavigationDashboard, Footer } from "..";
import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { getUserDetails } from "../../queries/getUserDetails";

export default function MainDashboard({ children, onLogoClick, onHomeClick }) {
  const { userID, setUserProfile, username, firstName } = useAuthStore();
  const { data: userData } = getUserDetails(userID);

  // Ensure user data is available as fallback (only if not already set)
  useEffect(() => {
    // Only fetch if we don't already have username or firstName in the store
    if (userData && (!username || !firstName)) {
      setUserProfile(userData);
    }
  }, [userData, setUserProfile, username, firstName]);

  return (
    <>
      <div className="min-h-screen bg-white flex flex-col items-center mb-20">
        <div className="w-full px-0 mx-0">
          <NavigationDashboard 
            onLogoClick={onLogoClick}
            onHomeClick={onHomeClick}
          />
        </div>
        <div className="w-full flex-1 flex flex-col items-center">
          {children}
        </div>
      </div>
      <Footer variant="dark" />
    </>
  );
}
