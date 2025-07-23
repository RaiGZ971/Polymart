import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  Items,
  CalendarPicker,
  Textarea,
  ToggleButton,
  OrderCalendarPicker,
} from "../../components";
import { placeOrderData } from "../../data";
import timeSlots from "../../data/timeSlots";
import Modal from "../shared/Modal"; // adjust path if needed

export default function PlaceOrder({ order, quantity = 1, onClose }) {
  // Initialize form state with placeOrderData and incoming order props
  const [form, setForm] = useState({
    ...placeOrderData,
    ...order,
    quantity,
    productsOrdered: [
      {
        name: order?.productName,
        image: order?.productImage,
        price: order?.productPrice,
        quantity,
      },
    ],
    meetUpLocation: order?.meetupLocations?.[0] || "",
    meetUpDate: "",
    meetUpTime: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState("confirm"); // "confirm" or "success"

  // Handle date change
  const handleDateChange = (date) => {
    setForm((prev) => ({
      ...prev,
      meetUpDate: date,
      meetUpTime: "", // reset time when date changes
    }));
  };

  const handleTimeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      meetUpTime: value,
    }));
  };

  // Handle remarks change
  const handleRemarksChange = (e) => {
    setForm((prev) => ({
      ...prev,
      remarks: e.target.value,
    }));
  };

  // Handle meet up location change
  const handleLocationChange = (location) => {
    setForm((prev) => ({
      ...prev,
      meetUpLocation: location,
    }));
  };

  // Add paymentMethods from order or fallback
  const paymentMethods = order?.paymentMethods || [
    "Cash",
    "GCash",
    "Bank Transfer",
  ];

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setForm((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-4xl  max-h-[700px] overflow-y-auto bg-white rounded-t-xl shadow-glow p-8 relative">
        <button
          className="flex items-center gap-2 text-gray-400 hover:text-primary-red text-lg font-medium"
          onClick={onClose}
          aria-label="Back"
        >
          <ChevronLeft size={24} />
          Back
        </button>
        <div className="flex flex-row justify-between items-center px-2 mt-6">
          <h1 className="text-3xl font-bold mb-4 text-primary-red">
            Place Order
          </h1>
          <p className="text-gray-800">Order Details</p>
        </div>
        {/* Content */}
        <div className="w-full flex flex-col gap-4">
          <Container>
            <Items order={form} />
          </Container>
          <Container>
            <div className="flex flex-col gap-1">
              <h2 className="font-bold mb-2 text-primary-red">Payment</h2>
              <h2 className="text-primary-red text-sm font-semibold">
                Choose a Payment Method
              </h2>
              <p className="text-sm text-gray-800">
                All payment transactions are made during meet ups{" "}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {paymentMethods.map((method) => (
                <ToggleButton
                  key={method}
                  label={method}
                  isActive={form.paymentMethod === method}
                  onClick={() => handlePaymentMethodChange(method)}
                />
              ))}
            </div>
          </Container>
          <Container>
            <div className="flex flex-col gap-1">
              <h2 className="font-bold mb-2 text-primary-red">Meet Up</h2>
              <h2 className="text-primary-red text-sm font-semibold">
                Choose a Meet Up Schedule
              </h2>
              <p className="text-sm text-gray-800">
                Seller’s available time and dates for meet-ups are listed below
              </p>
            </div>
            <OrderCalendarPicker
              availableSchedules={order.availableSchedules}
              selectedDate={form.meetUpDate}
              selectedTime={form.meetUpTime}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-primary-red text-sm font-semibold">
                Choose a Meet Up Location
              </h2>
              <p className="text-sm text-gray-800">
                Seller’s available meet-up locations are listed below{" "}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(order?.meetupLocations || []).map((location) => (
                  <ToggleButton
                    key={location}
                    label={location}
                    isActive={form.meetUpLocation === location}
                    onClick={() => handleLocationChange(location)}
                  />
                ))}
              </div>
            </div>
          </Container>
          <Container>
            <div>
              <h2 className="font-bold mb-2 text-primary-red">
                Remark (Optional)
              </h2>
              <Textarea
                label="Additional Remarks"
                rows={2}
                maxLength={200}
                value={form.remarks}
                onChange={handleRemarksChange}
              />
            </div>
          </Container>
          <Container>
            <div>
              <p className="text-primary-red font-bold text-base mb-1 space-y-1">
                Confirm Meet Up Details
              </p>
              <p className="text-sm text-gray-800">
                Date Placed: <strong>{form.datePlaced}</strong>
              </p>
              <p className="text-sm text-gray-800">
                Payment Method: <strong>{form.paymentMethod || "N/A"}</strong>
              </p>
              <p className="text-sm text-gray-800">
                Meet Up Schedule:{" "}
                <strong>
                  {form.meetUpDate && form.meetUpTime
                    ? `${new Date(form.meetUpDate).toLocaleDateString()} at ${
                        timeSlots.find((slot) => slot.value === form.meetUpTime)
                          ?.label || form.meetUpTime
                      }`
                    : "N/A"}
                </strong>
              </p>
              <p className="text-sm text-gray-800">
                Meet Up Location:{" "}
                <strong>{form.meetUpLocation || "N/A"}</strong>
              </p>
              <p className="text-sm text-gray-800">
                Remark: <strong>{form.remarks || "None"}</strong>
              </p>
              <p className="text-sm text-gray-800">
                Number of Items: <strong>{form.quantity || 1}</strong>
              </p>
            </div>
          </Container>
        </div>
      </div>
      <div className="bg-white w-full max-w-4xl p-4 flex justify-end z-20 shadow-light rounded-b-2xl space-x-2">
        <button
          className="border border-primary-red text-primary-red px-6 py-2 rounded-full hover:bg-primary-red hover:text-white font-semibold transition-colors"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="bg-primary-red text-white px-6 py-2 rounded-full font-semibold hover:bg-hover-red"
          onClick={() => setShowModal(true)}
        >
          Place Order
        </button>
      </div>
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setModalStep("confirm");
        }}
        title={modalStep === "confirm" ? "Confirm Order" : "Order Confirmed"}
        description={
          modalStep === "confirm"
            ? "Are you sure you want to place this order? Please review your details before confirming."
            : "Your order has been placed successfully!"
        }
        type={modalStep === "confirm" ? "confirm" : "alert"}
        onConfirm={() => {
          if (modalStep === "confirm") {
            setModalStep("success");
          } else {
            setShowModal(false);
            setModalStep("confirm");
            onClose();
          }
        }}
      ></Modal>
    </div>
  );
}

const Container = ({ children }) => (
  <div className="w-full relative rounded-xl bg-white shadow-light flex flex-col text-left justify-center items-center">
    <div className="w-full space-y-6 px-10 py-8">{children}</div>
  </div>
);
