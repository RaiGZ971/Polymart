const ordersSampleData = [
  {
    status: "Processing",
    productName: "Crocheted Photocard Holder",
    productImage: "https://picsum.photos/201/101",
    productPrice: 600,
    itemsOrdered: 2,
    username: "backburnerngbayan",
    userAvatar: "https://picsum.photos/201/150",
    paymentMethod: "Gcash",
    schedule: "2023-10-01 at 10:00 AM",
    location: "Lagoon",
    remark: "None",
    role: "user", // blue bar
    category: "creative", // from productCategories
    reviews: [
      {
        user: {
          name: "backburnerngbayan",
          avatar: "https://picsum.photos/201/150",
        },
        date: "2025/04/25 at 11:59 AM",
        content:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        rating: 3,
        images: [
          "https://picsum.photos/201/101",
          "https://picsum.photos/201/102",
          "https://picsum.photos/201/103",
          "https://picsum.photos/201/104",
        ],
        helpfulCount: 22,
      },
    ],
  },
  {
    status: "Completed",
    productName: "Handmade Tote Bag",
    productImage: "https://picsum.photos/202/101",
    productPrice: 350,
    itemsOrdered: 1,
    username: "craftycat",
    userAvatar: "https://picsum.photos/202/150",
    paymentMethod: "Cash",
    schedule: "2023-09-15 at 2:00 PM",
    location: "Main Gate",
    remark: "Please bring exact amount.",
    role: "other", // yellow bar
    category: "fashion", // from productCategories
    reviews: [
      {
        user: {
          name: "janedoe",
          avatar: "https://picsum.photos/202/150",
        },
        date: "2025/05/01 at 09:30 AM",
        content:
          "Great product! Fast shipping and excellent customer service. Will buy again.",
        rating: 5,
        images: [
          "https://picsum.photos/202/101",
          "https://picsum.photos/202/102",
        ],
        helpfulCount: 15,
      },
    ],
  },
  {
    status: "Ongoing",
    productName: "Sticker Pack",
    productImage: "https://picsum.photos/203/101",
    productPrice: 120,
    itemsOrdered: 5,
    username: "stickergal",
    userAvatar: "https://picsum.photos/203/150",
    paymentMethod: "Gcash",
    schedule: "2023-10-05 at 1:00 PM",
    location: "Grandstand",
    remark: "",
    role: "user", // blue bar
    category: "anik", // from productCategories
    reviews: [
      {
        user: {
          name: "juanperez",
          avatar: "https://picsum.photos/203/150",
        },
        date: "2025/05/10 at 03:45 PM",
        content:
          "Item arrived as described. Satisfied with the purchase, but packaging could be improved.",
        rating: 4,
        images: [
          "https://picsum.photos/203/101",
        ],
        helpfulCount: 8,
      },
    ],
  },
];

export default ordersSampleData;