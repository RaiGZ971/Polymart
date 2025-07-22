import { ChevronLeft } from "lucide-react";

export default function PlaceOrder({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-glow p-8 relative">
        <button
          className="flex items-center gap-2 text-gray-400 hover:text-primary-red text-lg font-medium"
          onClick={onClose}
          aria-label="Back"
        >
          <ChevronLeft size={24} />
          Back
        </button>
        <h1 className="text-2xl font-bold mb-4 text-primary-red">
          Place Order
        </h1>
        {/* Content */}

        <div className="w-full flex flex-col gap-4">
          <Container>
            <div className="flex flex-row gap-8 items-center justify-between">
              <div className="flex flex-row gap-8 items-center">
                <div className="">
                  <img
                    src="https://picsum.photos/247/245"
                    alt="Product Image"
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                </div>
                <div className="">
                  <h2 className="text-lg font-semibold">Product Name</h2>
                  <p className="text-primary-red font-bold text-lg">PHP 300</p>
                </div>
              </div>
              <span className="font-semibold text-gray-800">x 1</span>
            </div>
          </Container>

          <Container></Container>
        </div>
      </div>
    </div>
  );
}

const Container = ({ children }) => (
  <div className="w-full relative rounded-xl bg-white shadow-light flex flex-col text-left justify-center items-center">
    <div className="w-full space-y-6 px-10 py-8">{children}</div>
  </div>
);
