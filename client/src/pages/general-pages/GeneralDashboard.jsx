import { NavigationDashboard, SearchBar, CategoryFilter, DropdownFilter, SmallButton } from '../../components';
import { Cat, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { sortByPriceOptions, sortProducts } from '../../data';

export default function GeneralDashboard() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [products, setProducts] = useState([]); // Your products array

    const categories = [
        { name: 'All Categories', value: 'all' },
        { name: 'Academic Essentials', value: 'academic' },
        { name: 'Creative Works', value: 'creative' },
        { name: 'Services', value: 'services' },
        { name: 'Tech & Gadgets', value: 'technology' },
        { name: 'Fashion', value: 'fashion' },
        { name: 'Anik-Anik', value: 'anik' },
        { name: 'Other', value: 'other' }
    ];

    const handleCategoryClick = (categoryValue) => {
        setActiveCategory(categoryValue);
    };

    const handleSortChange = (newSortBy) => {
        setSortBy(newSortBy);
        const sortedProducts = sortProducts(products, newSortBy);
        setProducts(sortedProducts);
    };

    return (
       <div className='w-full h-screen bg-white flex flex-col items-center'>
            <div className="w-full px-0 mx-0">
                <NavigationDashboard/>
            </div>

            <div>
            </div>
            {/* Categories Section */}
            <div className='w-[80%] mt-0 space-y-6'>
                <h1 className="text-4xl font-bold text-primary-red mt-10">Welcome Back, User!</h1>
                <CategoryFilter />
            </div>

            <div className='w-[80%] mt-10 flex flex-row justify-between items-center gap-4'>
                <div className='w-[90%]'>
                    <SearchBar />
                </div>
                <div className='flex items-center justify-center text-sm gap-2 w-[10%]'>
                    <ShoppingBag size={24} />
                    Your Bag
                </div>
            </div>
            <div>
            
            {/* Products Filter Section */}
            <div className='flex items-center justify-end mt-2 gap-2 w-[80%]'>
            <SmallButton 
                label='Latest'
            />
            <SmallButton 
                label='Popular'
            />
            <DropdownFilter 
                options={sortByPriceOptions}
                selectedOption={sortBy}
                onChange={handleSortChange}
            />
            </div>
            </div>
        </div>
    );
}