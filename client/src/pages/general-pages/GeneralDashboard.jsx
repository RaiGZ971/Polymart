import { useState, useEffect } from "react";
import {
  SearchBar,
  CategoryFilter,
  DropdownFilter,
  SmallButton,
  ProductCard,
  Add,
  CreateListingComponent,
  MainDashboard,
} from "../../components";
import { sortOptions } from "../../data";
import { useDashboardData } from "../../hooks";
import { UserService } from "../../services";
import { useNavigate } from "react-router-dom";

export default function GeneralDashboard() {
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [activeTab, setActiveTab] = useState("all-listings");
  const [pendingSearch, setPendingSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Use the dashboard data hook
  const {
    listings,
    myListings,
    loading,
    error,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    refreshData
  } = useDashboardData();

  // Get current user on component mount
  useEffect(() => {
    const user = UserService.getCurrentUser();
    const token = localStorage.getItem('authToken');
    
    console.log('🔑 Authentication check:', {
      user,
      hasToken: !!token,
      token: token ? token.substring(0, 20) + '...' : null,
      isAuthenticated: UserService.isAuthenticated()
    });
    
    setCurrentUser(user);
    
    // If user is not authenticated, redirect to login
    if (!user || !UserService.isAuthenticated()) {
      console.log('❌ No user found or not authenticated, should redirect to sign-in');
      navigate('/sign-in');
      return;
    }
  }, [navigate]);

  const handleCategoryChange = (categoryValue) => {
    setActiveCategory(categoryValue);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  // Get the appropriate data based on active tab
  const displayedListings = activeTab === "your-listings" ? myListings : listings;

  const handleProductClick = (product) => {
    navigate("/buyer/view-product-details", { state: { order: product } });
  };

  const handleSearchInputChange = (value) => {
    setPendingSearch(value);
  };

  const handleSearchInputKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearchTerm(pendingSearch);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <MainDashboard>
        <div className="w-[80%] mt-10 flex justify-center items-center min-h-[400px]">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      </MainDashboard>
    );
  }

  // Show error state
  if (error) {
    return (
      <MainDashboard>
        <div className="w-[80%] mt-10 flex flex-col justify-center items-center min-h-[400px]">
          <div className="text-lg text-red-500 mb-4">Error: {error}</div>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-primary-red text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </MainDashboard>
    );
  }

  return (
    <MainDashboard>
      <div className="w-[80%] mt-0 space-y-6">
        <h1 className="text-4xl font-bold text-primary-red mt-10">
          Welcome Back, {currentUser?.username || 'User'}!
        </h1>
        <CategoryFilter
          onCategoryChange={handleCategoryChange}
          initialCategory={activeCategory}
        />
      </div>

      <div className="w-[80%] mt-10 flex flex-row justify-between items-center">
        <SearchBar
          searchTerm={pendingSearch}
          setSearchTerm={handleSearchInputChange}
          onKeyDown={handleSearchInputKeyDown}
        />
      </div>
      <div className="flex items-center justify-between w-[80%] mt-10">
        <div className="flex flex-row gap-4 justify-end ">
          <button
            className={`font-semibold ${
              activeTab === "all-listings"
                ? "text-primary-red underline"
                : "text-gray-400 hover:text-primary-red"
            }`}
            onClick={() => setActiveTab("all-listings")}
          >
            All Listings
          </button>
          <span className="font-semibold text-gray-400">|</span>
          <button
            className={`font-semibold ${
              activeTab === "your-listings"
                ? "text-primary-red underline"
                : "text-gray-400 hover:text-primary-red"
            }`}
            onClick={() => setActiveTab("your-listings")}
          >
            Your Listings
          </button>
        </div>
        <DropdownFilter
          options={sortOptions}
          selectedOption={sortBy}
          onChange={handleSortChange}
        />
      </div>
      <div className="w-[80%] min-h-[300px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-4 mx-auto">
        {displayedListings.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[200px]">
            <span className="text-gray-500 text-lg py-12">
              {activeTab === "your-listings" ? "No listings found. Create your first listing!" : "No items matched"}
            </span>
          </div>
        ) : (
          <>
            {activeTab === "your-listings" && (
              <div className="h-full">
                <Add
                  text="Add a new listing"
                  className="w-[268px] h-[346px] min-w-[247px] min-h-[346px]"
                  onClick={() => setShowCreateListing(true)}
                />
              </div>
            )}
            {displayedListings.map((product, idx) => (
              <div
                key={product.id || idx}
                onClick={() => handleProductClick(product)}
                className="cursor-pointer h-full"
              >
                <ProductCard order={product} />
              </div>
            ))}
          </>
        )}
      </div>
      {showCreateListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
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
            <CreateListingComponent
              onClose={() => setShowCreateListing(false)}
            />
          </div>
        </div>
      )}
    </MainDashboard>
  );
}
