function formatDatePlaced(date = new Date()) {
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateStr} at ${timeStr}`;
}

const placeOrderData = {
  orderId: "",
  productName: "",
  productPrice: "",
  productOfferPrice: "",
  meetUpDate: null,
  meetUpLocation: "",
  paymentMethod: "",
  schedule: "",
  datePlaced: formatDatePlaced(),
  status: "placed",
  remarks: "",
  quantity: "",
  // Add more fields as needed
};

export default placeOrderData;
