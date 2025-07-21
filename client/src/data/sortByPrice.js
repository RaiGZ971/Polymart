export const sortByPriceOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Low to High', value: 'low-to-high' },
    { label: 'High to Low', value: 'high-to-low' },
];

export const sortProducts = (products, sortBy) => {
    const sortedProducts = [...products];
    
    switch (sortBy) {
        case 'low-to-high':
            return sortedProducts.sort((a, b) => a.price - b.price);
        case 'high-to-low':
            return sortedProducts.sort((a, b) => b.price - a.price);
        default:
            return sortedProducts;
    }
};