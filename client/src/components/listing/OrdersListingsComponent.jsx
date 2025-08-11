import { ChevronRight } from "lucide-react";

const statusColor = {
  completed: "#34A853",
  placed: "#FBBC04",
  "order placed": "#FBBC04", // Add this line for consistency
  cancelled: "#FF0000",
  ongoing: "#2670F9",
  rescheduled: "#F97B26",
};

function getStatusLabel(status) {
  if (!status) return "";
  const map = {
    completed: "Completed",
    "order placed": "Order Placed",
    placed: "Order Placed",
    cancelled: "Cancelled",
    ongoing: "Ongoing",
    rescheduled: "Rescheduled",
  };
  return map[status.toLowerCase()] || status;
}

export default function OrdersListingsComponent({
  status,
  productName,
  productImage,
  productPrice,
  itemsOrdered,
  username,
  userAvatar,
  paymentMethod,
  schedule,
  location,
  remark,
  role,
  transaction_method,
}) {
  const isUser = role === "user";
  const barBg = isUser ? "bg-[#FFE38799]" : "bg-[#B7DBFF80]";
  const barHover = isUser ? "hover:bg-[#FFE387EB]" : " hover:bg-[#B7DBFF]";

  const statusKey = status?.toLowerCase();
  const statusTextColor = statusColor[statusKey] || "#333";

  // Check if the transaction method is meet-up
  const isMeetupTransaction = transaction_method === 'Meet-up';

  return (
    <div className="flex flex-col w-full group shadow-glow rounded-2xl hover:scale-[102%] transition-transform duration-300 ease-in-out cursor-pointer">
      {/* Top Section: Product & Order Details */}
      <div className="w-full shadow-lg flex flex-row items-center p-8 rounded-t-2xl text-left">
        {/* Product Image */}
        <div className="w-[20%] flex-shrink-0">
          <img
            src={productImage || "https://picsum.photos/201/101"}
            alt="Product"
            className="opacity-60 w-40 h-40 rounded-xl"
          />
        </div>

        {/* Order Details & User */}
        <div className="w-[50%] px-6">
          <div className="mb-4">
            <p
              className="text-sm font-semibold"
              style={{ color: statusTextColor }}
            >
              {getStatusLabel(status)}
            </p>
            <h1 className="text-lg text-gray-800 font-bold">{productName}</h1>
            <h2 className="text-lg text-primary-red font-bold -mt-2">
              PHP {productPrice}
            </h2>
            <p className="text-xs">
              {itemsOrdered} item{itemsOrdered > 1 ? "s" : ""} ordered
            </p>
          </div>
          <div className="flex flex-row items-center gap-2">
            <img
              src={userAvatar || "https://picsum.photos/201/150"}
              alt="User Avatar"
              className="opacity-60 w-8 h-8 rounded-full"
            />
            <p className="text-xs font-semibold text-gray-800">{username}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="w-[30%] pl-6 border-l border-gray-200">
          <p className="text-sm text-gray-800 font-semibold mb-2">
            Order Details
          </p>
          <p className="text-xs">Transaction: {transaction_method || "N/A"}</p>
          <p className="text-xs">Payment: {paymentMethod}</p>
          {isMeetupTransaction && (
            <>
              <p className="text-xs">Schedule: {schedule}</p>
              <p className="text-xs">Location: {location}</p>
            </>
          )}
          <p className="text-xs">Remarks: {remark || "None"}</p>
        </div>
      </div>

      {/* Bottom Bar: Action */}
      <div
        className={`text-sm rounded-b-2xl flex justify-end transition-colors duration-300 ease-in-out ${barBg} ${barHover}`}
      >
        <button className="flex items-center gap-2 text-gray-600 font-semibold px-6 py-3 rounded-lg group-hover:underline">
          View Product Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
