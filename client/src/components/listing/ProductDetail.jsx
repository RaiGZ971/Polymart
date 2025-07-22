import { ChevronLeft } from "lucide-react";
import QuantityPicker from "../form-elements/QuantityPicker";

const statusColor = {
  completed: "#34A853",
  processing: "#FBBC04",
  cancelled: "#FF0000",
  ongoing: "#2670F9",
  rescheduled: "#F97B26",
};

export default function ProductDetail({ order, onBack }) {
  if (!order) return null;

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
              src="https://picsum.photos/247/245"
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
            <div>
              <p className="text-primary-red font-bold text-base mb-1 space-y-1">
                Meet Up Details
              </p>
              <p className="text-sm text-gray-800">
                Payment Method: <strong>{order.paymentMethod}</strong>
              </p>
              <p className="text-sm text-gray-800">
                Meet Up Schedule: <strong>{order.schedule}</strong>
              </p>
              <p className="text-sm text-gray-800">
                Meet Up Location: <strong>{order.location}</strong>
              </p>
              <p className="text-sm text-gray-800">
                Remark: <strong>{order.remark || "None"}</strong>
              </p>
              <p className="text-sm text-gray-800">
                Number of Items: <strong>{order.itemsOrdered}</strong>
              </p>
            </div>
          </Container>
        </div>

        <div className="px-20">
          <Container>
            <p className="text-primary-red font-bold text-base mb-1 space-y-1">
              Items
            </p>
            <Item />
            <Item />
            <div className="w-full flex flex-row justify-between items-center mt-2">
              <h1 className="text-2xl font-semibold">Total</h1>
              <h1 className="text-2xl font-bold text-primary-red">PHP 600</h1>
            </div>
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

const Item = ({ productName, productPrice, quantity, productImage }) => (
  <div className="w-full flex flex-row justify-between">
    <div className="flex flex-row gap-4 items-center w-full">
      <div>
        <img
          src="https://picsum.photos/247/245"
          alt="Product Image"
          className="w-24 h-24 rounded-2xl object-cover"
        />
      </div>
      <div className="flex flex-col">
        <p className="text-gray-800 font-semibold">
          Crocheted Photocard Holder
        </p>
        <p className="text-primary-red text-sm font-bold">PHP 300</p>
      </div>
    </div>
    <div className="items-center flex flex-row">x1</div>
  </div>
);
