import { useState } from "react";
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
import { sortByPriceOptions } from "../../data";
import ordersSampleData from "../../data/ordersSampleData";
import { useNavigate } from "react-router-dom";

export default function GeneralDashboard() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [showCreateListing, setShowCreateListing] = useState(false);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all-listings");

  const currentUser = { id: "user123", role: "user" };

  const handleCategoryChange = (categoryValue) => {
    setActiveCategory(categoryValue);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  // Separate data for All Listings and Your Listings
  const allListings = ordersSampleData.filter((order) => {
    const matchesCategory =
      activeCategory === "all" || order.category === activeCategory;
    const matchesSearch = order.productName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const yourListings = ordersSampleData.filter((order) => {
    const matchesCategory =
      activeCategory === "all" || order.category === activeCategory;
    const matchesSearch = order.productName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return (
      matchesCategory && matchesSearch && order.seller_id === currentUser.id // Make sure your data has sellerId
    );
  });

  // Choose which data to display based on activeTab
  const filteredOrders =
    activeTab === "your-listings" ? yourListings : allListings;

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "low-to-high") {
      return a.productPrice - b.productPrice;
    } else if (sortBy === "high-to-low") {
      return b.productPrice - a.productPrice;
    }
    return 0;
  });

  const handleProductClick = (order) => {
    navigate("/buyer/view-product-details", { state: { order } });
  };

  const handleSearchInputChange = (value) => {
    setPendingSearch(value);
  };

  const handleSearchInputKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearchTerm(pendingSearch);
    }
  };

  return (
    <MainDashboard>
      {/* Categories Section */}
      <div className="w-[80%] mt-0 space-y-6">
        <h1 className="text-4xl font-bold text-primary-red mt-10">
          Welcome Back, User!
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
      {/* Products Filter Section */}
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
          options={sortByPriceOptions}
          selectedOption={sortBy}
          labelPrefix="Price"
          onChange={handleSortChange}
        />
      </div>
      {/* Product Cards Grid */}
      <div className="w-[80%] min-h-[300px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-4 mx-auto">
        {sortedOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[200px]">
            <span className="text-gray-500 text-lg py-12">
              No items matched
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
            {sortedOrders.map((order, idx) => (
              <div
                key={idx}
                onClick={() => handleProductClick(order)}
                className="cursor-pointer h-full"
              >
                <ProductCard order={order} />
              </div>
            ))}
          </>
        )}
      </div>
      {/* Overlay for CreateListingComponent */}
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
