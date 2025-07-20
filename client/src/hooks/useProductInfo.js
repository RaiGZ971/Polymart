export function useProductInfo(chatId) {
    const getProductInfo = () => {
        const productInfoMap = {
            1: {
                productName: "Crocheted Photocard Holder",
                productPrice: "PHP 300",
                meetUpPlace: "PUP Lagoon",
                meetUpDay: "Monday",
                meetUpTime: "10:30 AM"
            },
            2: {
                productName: "Handmade Tote Bag",
                productPrice: "PHP 450",
                meetUpPlace: "SM Mall",
                meetUpDay: "Tuesday",
                meetUpTime: "2:00 PM"
            },
            3: {
                productName: "Custom Phone Case",
                productPrice: "PHP 250",
                meetUpPlace: "Coffee Shop",
                meetUpDay: "Wednesday",
                meetUpTime: "4:30 PM"
            },
            4: {
                productName: "Custom Phone Case",
                productPrice: "PHP 250",
                meetUpPlace: "Coffee Shop",
                meetUpDay: "Wednesday",
                meetUpTime: "4:30 PM"
            }
        };

        return productInfoMap[chatId] || {
            productName: "Product Name",
            productPrice: "PHP 0",
            meetUpPlace: "TBA",
            meetUpDay: "TBA",
            meetUpTime: "TBA"
        };
    };

    return getProductInfo();
}