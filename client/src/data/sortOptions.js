export const sortOptions = [
    { label: 'Date Added (Newest)', value: 'newest' },
    { label: 'Date Added (Oldest)', value: 'date_oldest' },
    { label: 'Name (A-Z)', value: 'name_a_z' },
    { label: 'Name (Z-A)', value: 'name_z_a' },
    { label: 'Low to High', value: 'price_low_high' },
    { label: 'High to Low', value: 'price_high_low' },
];

export const sortProducts = (products, sortBy) => {
    const sortedProducts = [...products];
    
    switch (sortBy) {
        case 'price_low_high':
            return sortedProducts.sort((a, b) => {
                const priceA = a.priceRange ? a.priceRange.min : (a.productPrice || a.price_min || 0);
                const priceB = b.priceRange ? b.priceRange.min : (b.productPrice || b.price_min || 0);
                return priceA - priceB;
            });
        case 'price_high_low':
            return sortedProducts.sort((a, b) => {
                const priceA = a.priceRange ? a.priceRange.min : (a.productPrice || a.price_min || 0);
                const priceB = b.priceRange ? b.priceRange.min : (b.productPrice || b.price_min || 0);
                return priceB - priceA;
            });
        case 'name_a_z':
            return sortedProducts.sort((a, b) => {
                const nameA = (a.productName || a.name || '').toLowerCase();
                const nameB = (b.productName || b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
        case 'name_z_a':
            return sortedProducts.sort((a, b) => {
                const nameA = (a.productName || a.name || '').toLowerCase();
                const nameB = (b.productName || b.name || '').toLowerCase();
                return nameB.localeCompare(nameA);
            });
        case 'date_oldest':
            return sortedProducts.sort((a, b) => {
                const dateA = new Date(a.created_at || a.date || 0);
                const dateB = new Date(b.created_at || b.date || 0);
                return dateA - dateB;
            });
        case 'newest':
        default:
            return sortedProducts.sort((a, b) => {
                const dateA = new Date(a.created_at || a.date || 0);
                const dateB = new Date(b.created_at || b.date || 0);
                return dateB - dateA;
            });
    }
};