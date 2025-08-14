import { NavigationDashboard, Footer } from "..";
import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { getUserDetails } from "../../queries/getUserDetails";

export default function MainDashboard({ children, onLogoClick, onHomeClick }) {
  const { userID, setUserProfile, username, firstName } = useAuthStore();
  const { data: userData } = getUserDetails(userID);

  // Ensure user data is available as fallback (only if not already set)
  useEffect(() => {
    // Update profile data if we have new data from the server
    if (userData && (userData.username || userData.first_name)) {
      const updatedProfile = {
        username: userData.username,
        first_name: userData.first_name
      };
      
      // Update the auth store with the fresh data from the database
      setUserProfile(updatedProfile);
    }
  }, [userData, setUserProfile]);

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
