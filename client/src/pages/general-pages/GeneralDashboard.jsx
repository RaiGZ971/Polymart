import { useState } from 'react';
import { SearchBar, CategoryFilter, DropdownFilter, SmallButton, ProductCard } from '../../components';
import { ShoppingBag } from 'lucide-react';
import { sortByPriceOptions } from '../../data';
import MainDashboard from '../../components/layout/MainDashboard';
import ordersSampleData from '../../data/ordersSampleData';
import { useNavigate } from 'react-router-dom';

export default function GeneralDashboard() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingSearch, setPendingSearch] = useState('');
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('all-listings'); 

    const currentUser = { id: 'user123', role: 'user' };

    const handleCategoryChange = (categoryValue) => {
        setActiveCategory(categoryValue);
    };

    const handleSortChange = (newSortBy) => {
        setSortBy(newSortBy);
    };

    const filteredOrders = ordersSampleData.filter(order => {
        const matchesCategory = activeCategory === 'all' || order.category === activeCategory;
        const matchesSearch = order.productName.toLowerCase().includes(searchTerm.toLowerCase());
        // Tab filtering
        if (activeTab === 'your-listings') {
            return matchesCategory && matchesSearch && order.sellerId === currentUser.id;
        }
        // all-listings
        return matchesCategory && matchesSearch;
    });

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortBy === 'low-to-high') {
            return a.productPrice - b.productPrice;
        } else if (sortBy === 'high-to-low') {
            return b.productPrice - a.productPrice;
        }
        return 0;
    });

    const handleProductClick = (order) => {
        navigate('/buyer/view-product-details', { state: { order } });
    };

    const handleSearchInputChange = (value) => {
        setPendingSearch(value);
    };

    const handleSearchInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            setSearchTerm(pendingSearch);
        }
    };

    return (
        <MainDashboard>
            {/* Categories Section */}
            <div className='w-[80%] mt-0 space-y-6'>
                <h1 className="text-4xl font-bold text-primary-red mt-10">Welcome Back, User!</h1>
                <CategoryFilter onCategoryChange={handleCategoryChange} initialCategory={activeCategory} />
            </div>

            <div className='w-[80%] mt-10 flex flex-row justify-between items-center gap-4'>
                <div className='w-[90%]'>
                    <SearchBar
                        searchTerm={pendingSearch}
                        setSearchTerm={handleSearchInputChange}
                        onKeyDown={handleSearchInputKeyDown}
                    />
                </div>
                <div className='flex items-center justify-center text-sm gap-2 w-[10%]'>
                    <ShoppingBag size={24} />
                    Your Bag
                </div>
            </div>
            {/* Products Filter Section */}
            <div className='flex items-center justify-between gap-2 w-[80%] mt-10'>
                <div className="flex flex-row gap-4 justify-end ">
                    <button
                        className={`font-semibold ${activeTab === "all-listings" ? "text-primary-red underline" : "text-gray-400 hover:text-primary-red"}`}
                        onClick={() => setActiveTab("all-listings")}
                    >
                        All Listings
                    </button>
                    <span className="font-semibold text-gray-400">|</span>
                    <button
                        className={`font-semibold ${activeTab === "your-listings" ? "text-primary-red underline" : "text-gray-400 hover:text-primary-red"}`}
                        onClick={() => setActiveTab("your-listings")}
                    >
                        Your Listings
                    </button>
                </div>
                <DropdownFilter 
                    options={sortByPriceOptions}
                    selectedOption={sortBy}
                    labelPrefix='Price'
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
                    sortedOrders.map((order, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleProductClick(order)}
                            className="cursor-pointer h-full"
                        >
                            <ProductCard order={order} />
                        </div>
                    ))
                )}
            </div>
        </MainDashboard>
    );
}