import { NavigationDashboard, Footer } from "..";

export default function MainDashboard({ children, onLogoClick, onHomeClick }) {
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
