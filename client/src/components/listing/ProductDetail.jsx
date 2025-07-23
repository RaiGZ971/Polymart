import { ChevronLeft } from "lucide-react";
import { Items, MeetUpDetails } from "../../components";

const statusColor = {
  completed: "#34A853",
  processing: "#FBBC04",
  cancelled: "#FF0000",
  ongoing: "#2670F9",
  rescheduled: "#F97B26",
};

export default function ProductDetail({ order, onBack }) {
  if (!order) return null;

  // Use the productsOrdered array if available, fallback to items
  const items = order.productsOrdered || order.items || [];

  return (
    <>
      <div className="bg-white shadow-glow text-left space-y-8 flex flex-col rounded-xl">
        <div
          className="px-14 pt-10 text-gray-400 font-regular text-sm cursor-pointer hover:text-primary-red transition-colors"
          onClick={onBack}
        >
          <ChevronLeft size={24} className="inline" />
          Back
        </div>
        {/* Header */}
        <div className="px-20 flex flex-row items-center justify-between">
          <h1 className="text-3xl font-bold text-primary-red">Order Details</h1>
          <p
            style={{
              color: statusColor[order.status?.toLowerCase()] || "#333",
              fontWeight: "bold",
              textTransform: "capitalize",
            }}
          >
            {order.status}
          </p>
        </div>
        {/* Buyer Details */}
        <div className="flex flex-row justify-between px-20">
          <div className="flex flex-row items-center gap-4">
            <img
              src={order.userAvatar || "https://picsum.photos/247/245"}
              alt="User Image"
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <p className="font-bold text-xl">{order.username}</p>
              <p className="text-gray-500">PUP Sta Mesa | CCIS</p>
            </div>
          </div>
          <button className="bg-primary-red text-white px-4 py-1  max-h-10 rounded-lg hover:bg-hover-red transition-colors text-sm">
            Message Seller
          </button>
        </div>

        <div className="px-20">
          <Container>
            <MeetUpDetails order={order} />
          </Container>
        </div>

        <div className="px-20">
          <Container>
            {/* Pass the updated items array as a prop */}
            <Items order={{ ...order, productsOrdered: items }} />
          </Container>
        </div>
        <div className="w-full px-24 py-4 flex flex-row justify-between items-center bg-white shadow-light rounded-b-xl">
          <button className="text-gray-800 hover:text-primary-red hover:font-semibold">
            Report Bogus
          </button>
          <button className="bg-primary-red text-white px-5 py-1.5 rounded-full hover:bg-red-600 transition-colors">
            Order Completed
          </button>
        </div>
      </div>
    </>
  );
}

const Container = ({ children }) => (
  <div className="w-full relative rounded-xl bg-white shadow-light flex flex-col text-left justify-center items-center">
    <div className="w-full space-y-6 px-10 py-8">{children}</div>
  </div>
);
