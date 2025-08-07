import { useState, useEffect } from 'react';
import {
  SearchBar,
  CategoryFilter,
  DropdownFilter,
  SmallButton,
  ProductCard,
  Add,
  CreateListingComponent,
  MainDashboard,
} from '../../components';
import { sortOptions } from '../../data';
import { useDashboardData } from '../../hooks';
import { UserService } from '../../services';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useDashboardStore } from '../../store/dashboardStore.js';

export default function GeneralDashboard() {
  const [showCreateListing, setShowCreateListing] = useState(false);
  const { activeTab, setActiveTab } = useDashboardStore(); // Use in-memory store
  const [pendingSearch, setPendingSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Use the dashboard data hook
  const {
    listings,
    myListings,
    loading,
    searchLoading,
    error,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    refreshData,
    refreshHome,
  } = useDashboardData();

  const { currentUser: user, token, isAuthenticated } = useAuthStore();

  // Get current user on component mount
  useEffect(() => {
    console.log('🔑 Authentication check:', {
      user,
      hasToken: !!token,
      token: token ? token.substring(0, 20) + '...' : null,
      isAuthenticated,
    });

    setCurrentUser(user);

    // If user is not authenticated, redirect to login
    if (!user || !UserService.isAuthenticated(token)) {
      console.log(
        '❌ No user found or not authenticated, should redirect to sign-in'
      );
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
  const displayedListings =
    activeTab === 'your-listings' ? myListings : listings;

  const handleProductClick = (product) => {
    const listingId = product.listing_id || product.id;
    navigate(`/buyer/view-product-details/${listingId}`, {
      state: { order: product },
    });
  };

  const handleSearchInputChange = (value) => {
    setPendingSearch(value);
  };

  const handleSearchInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      setSearchTerm(pendingSearch);
    }
  };

  // Cleanup timeout on component unmount (remove timeout logic)
  useEffect(() => {
    // No cleanup needed since we removed debouncing
  }, []);

  // Show error state only (loading is handled inline)
  if (error) {
    return (
      <MainDashboard onLogoClick={refreshHome} onHomeClick={refreshHome}>
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
    <MainDashboard onLogoClick={refreshHome} onHomeClick={refreshHome}>
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
        <div className="relative w-full">
          <SearchBar
            searchTerm={pendingSearch}
            setSearchTerm={handleSearchInputChange}
            onKeyDown={handleSearchInputKeyDown}
          />
          {searchLoading && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-red"></div>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between w-[80%] mt-10">
        <div className="flex flex-row gap-4 justify-end ">
          <button
            className={`font-semibold ${
              activeTab === 'all-listings'
                ? 'text-primary-red underline'
                : 'text-gray-400 hover:text-primary-red'
            }`}
            onClick={() => setActiveTab('all-listings')}
          >
            All Listings
          </button>
          <span className="font-semibold text-gray-400">|</span>
          <button
            className={`font-semibold ${
              activeTab === 'your-listings'
                ? 'text-primary-red underline'
                : 'text-gray-400 hover:text-primary-red'
            }`}
            onClick={() => setActiveTab('your-listings')}
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
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[200px]">
            <div className="text-lg text-gray-500">Loading listings...</div>
          </div>
        ) : searchLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[200px]">
            <div className="text-lg text-gray-500">Searching...</div>
          </div>
        ) : displayedListings.length === 0 ? (
          activeTab === 'your-listings' ? (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[200px] gap-6">
              <span className="text-gray-500 text-lg">
                No listings found. Create your first listing!
              </span>
              <Add
                text="Add a new listing"
                className="w-[268px] h-[346px] min-w-[247px] min-h-[346px]"
                onClick={() => setShowCreateListing(true)}
              />
            </div>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[200px]">
              <span className="text-gray-500 text-lg py-12">
                No items matched
              </span>
            </div>
          )
        ) : (
          <>
            {activeTab === 'your-listings' && (
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
              animation: 'fadeScaleIn 0.3s cubic-bezier(0.4,0,0.2,1)',
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
