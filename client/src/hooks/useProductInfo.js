export function useProductInfo(chatId) {
    const getProductInfo = () => {
        const productInfoMap = {
            1: {
                productName: "Crocheted Photocard Holder",
                productPrice: "PHP 300",
                meetUpPlace: "PUP Lagoon",
                meetUpDay: "Monday",
                meetUpTime: "10:00 AM"
            },
            2: {
                productName: "Handmade Tote Bag",
                productPrice: "PHP 450",
                meetUpPlace: "Souvenir Shop",
                meetUpDay: "Tuesday",
                meetUpTime: "2:00 PM"
            },
            3: {
                productName: "Custom Phone Case",
                productPrice: "PHP 250",
                meetUpPlace: "Grandstand",
                meetUpDay: "Wednesday",
                meetUpTime: "5:00 PM"
            },
            4: {
                productName: "Custom Phone Case",
                productPrice: "PHP 250",
                meetUpPlace: "Lagoon",
                meetUpDay: "Wednesday",
                meetUpTime: "4:00 PM"
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