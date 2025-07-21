import { SearchBar, CategoryFilter, DropdownFilter, SmallButton } from '../../components';
import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { sortByPriceOptions, sortProducts, productCategories } from '../../data';
import MainDashboard from '../../components/layout/MainDashboard';

export default function GeneralDashboard() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [products, setProducts] = useState([]); // Your products array

    const handleCategoryClick = (categoryValue) => {
        setActiveCategory(categoryValue);
    };

    const handleSortChange = (newSortBy) => {
        setSortBy(newSortBy);
        const sortedProducts = sortProducts(products, newSortBy);
        setProducts(sortedProducts);
    };

    return (
        <MainDashboard>
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
            {/* Products Filter Section */}
            <div className='flex items-center justify-end mt-2 gap-2 w-[80%]'>
                <SmallButton label='Latest' />
                <SmallButton label='Popular' />
                <DropdownFilter 
                    options={sortByPriceOptions}
                    selectedOption={sortBy}
                    labelPrefix='Price'
                    onChange={handleSortChange}
                />
            </div>
        </MainDashboard>
    );
}