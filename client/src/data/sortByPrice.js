export const sortByPriceOptions = [
    { value: 'price-asc', label: 'Low to High' },
    { value: 'price-desc', label: 'High to Low' }
];

export const sortProducts = (products, sortBy) => {
    const sortedProducts = [...products];
    
    switch (sortBy) {
        case 'price-asc':
            return sortedProducts.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return sortedProducts.sort((a, b) => b.price - a.price);
        default:
            return sortedProducts;
    }
};