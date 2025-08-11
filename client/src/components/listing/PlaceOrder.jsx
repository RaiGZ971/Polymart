import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  Items,
  CalendarPicker,
  Textarea,
  ToggleButton,
  OrderCalendarPicker,
  Modal,
} from "../../components";
import placeOrderData from "../../data/placeOrderData";
import timeSlots from "@/data/timeSlots";
import paymentMethods from "../../data/paymentMethods";
import { OrderService } from "../../services";

export default function PlaceOrder({ order, quantity, onClose,  currentUser, onOrderCreated }) {
  // Debug: Log the order object to see what data we have
  console.log('PlaceOrder order data:', order);
  console.log('Available schedules:', order.available_schedules || order.availableSchedules);
  
  const [form, setForm] = useState({
    ...placeOrderData,
    ...order,
    quantity,
    productsOrdered: [
      {
        name: order?.productName,
        image: order?.productImage,
        // Use offer price if present, else normal price
        price: order?.productPriceOffer || order?.productPrice,
        quantity,
      },
    ],
    meetUpLocation: order?.meetupLocations?.[0] || "",
    meetUpDate: "",
    meetUpTime: "",
    // Use offer note/message if present, else remarks
    remarks: order?.offerMessage || order?.remarks || "",
  });

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState("confirm");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleDateChange = (date) => {
    setForm((prev) => ({
      ...prev,
      meetUpDate: date,
      meetUpTime: "",
    }));
  };

  const handleTimeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      meetUpTime: value,
    }));
  };

  // Helper function to get the actual time string for API calls
  const getActualTimeForAPI = (timeValue) => {
    // If it's a standard time slot, convert it to a timestamp-compatible format
    const timeSlot = timeSlots.find(slot => slot.value === timeValue);
    if (timeSlot) {
      // Convert "6am-7am" to "06:00"
      const startTime = timeSlot.value.split('-')[0];
      const hour = startTime.replace(/[ap]m/, '');
      const isPM = startTime.includes('pm');
      let hourNum = parseInt(hour);
      if (isPM && hourNum !== 12) hourNum += 12;
      if (!isPM && hourNum === 12) hourNum = 0;
      return String(hourNum).padStart(2, '0') + ':00';
    }
    
    // For custom time slots, try to parse the time from the available schedules
    const availableSchedules = order.available_schedules || order.availableSchedules || [];
    for (const schedule of availableSchedules) {
      if (schedule.date === form.meetUpDate) {
        // Find the time that matches this custom slot
        const customIndex = parseInt(timeValue.replace('custom-', ''));
        if (!isNaN(customIndex) && schedule.times[customIndex]) {
          // Parse "5:00 AM - 7:00 AM" to get start time
          const timeString = schedule.times[customIndex];
          const startTime = timeString.split(' - ')[0];
          // Convert to 24-hour format
          const [time, period] = startTime.split(' ');
          const [hour, minute] = time.split(':');
          let hourNum = parseInt(hour);
          if (period === 'PM' && hourNum !== 12) hourNum += 12;
          if (period === 'AM' && hourNum === 12) hourNum = 0;
          return String(hourNum).padStart(2, '0') + ':' + minute;
        }
      }
    }
    
    // Fallback: assume it's already in the right format
    return timeValue;
  };

  const handleRemarksChange = (e) => {
    setForm((prev) => ({
      ...prev,
      remarks: e.target.value,
    }));
  };

  const handleLocationChange = (location) => {
    setForm((prev) => ({
      ...prev,
      meetUpLocation: location,
    }));
  };

  const availablePaymentMethods = order?.paymentMethods || paymentMethods.map(pm => pm.value);

  const handlePaymentMethodChange = (method) => {
    setForm((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  };

  // Check if transaction includes meet-up
  const transactionMethods = order.transaction_methods || order.transactionMethods || [];
  const hasMeetup = transactionMethods.includes('Meet-up');
  const isOnlineOnly = transactionMethods.length === 1 && transactionMethods.includes('Online');

  // Validation: All required fields must be filled
  // For meetup orders, require meetup details; for online-only orders, only require payment method
  const isFormValid = hasMeetup
    ? form.paymentMethod &&
      form.meetUpDate &&
      form.meetUpTime &&
      form.meetUpLocation &&
      form.quantity > 0
    : form.paymentMethod && form.quantity > 0;

  // Handle order creation
  const handleCreateOrder = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Determine transaction method - default to Meet-up since this component is designed for meetups
      // In the future, this could be made dynamic based on listing.transaction_methods
      const transactionMethod = order.transaction_methods?.includes('Meet-up') ? 'Meet-up' : 
                               order.transaction_methods?.[0] || 'Meet-up';

      // Prepare order data for API
      const orderData = {
        listing_id: order.listing_id || order.id,
        quantity: form.quantity,
        transaction_method: transactionMethod,
        payment_method: form.paymentMethod,
        buyer_requested_price: order.productPriceOffer || null,
      };

      console.log('Sending order data:', orderData); // Debug log

      // Create the order
      const response = await OrderService.createOrder(orderData);
      
      if (response.success) {
        const orderId = response.data.order_id;
        
        // If order was created successfully and has meetup transaction method,
        // create the meetup with the selected details
        if (orderData.transaction_method === "Meet-up") {
          const actualTime = getActualTimeForAPI(form.meetUpTime);
          const meetupData = {
            location: form.meetUpLocation,
            scheduled_at: `${form.meetUpDate}T${actualTime}:00.000Z`,
            remarks: form.remarks || null,
            proposed_by: "buyer"  // Always buyer when placing order
          };

          try {
            await OrderService.createMeetup(orderId, meetupData);
          } catch (meetupError) {
            console.warn("Order created but meetup creation failed:", meetupError);
            // Don't fail the entire process if meetup creation fails
          }
        }

        setModalStep("success");
        
        // Call the callback to refresh orders if provided
        if (onOrderCreated) {
          onOrderCreated();
        }
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        setSubmitError("You already have a pending order for this product. Please check your orders page.");
      } else {
        setSubmitError(error.message || "Failed to create order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-white rounded-t-xl shadow-glow p-8 relative">
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
                {hasMeetup && !isOnlineOnly
                  ? "All payment transactions are made during meet ups"
                  : isOnlineOnly
                  ? "Payment arrangements are made through chat"
                  : "Payment method depends on transaction type"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {availablePaymentMethods.map((method) => (
                <ToggleButton
                  key={method}
                  label={method}
                  isActive={form.paymentMethod === method}
                  onClick={() => handlePaymentMethodChange(method)}
                />
              ))}
            </div>
          </Container>
          {hasMeetup && (
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
              availableSchedules={order.available_schedules || order.availableSchedules || []}
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
                {(order?.seller_meetup_locations || order?.meetupLocations || []).map((location) => (
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
          )}
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
                Confirm Order Details
              </p>
              <p className="text-sm text-gray-800">
                Date Placed: <strong>{form.datePlaced}</strong>
              </p>
              <p className="text-sm text-gray-800">
                Payment Method: <strong>{form.paymentMethod || "N/A"}</strong>
              </p>
              {hasMeetup && (
                <>
                  <p className="text-sm text-gray-800">
                    Meet Up Schedule:{" "}
                    <strong>
                      {form.meetUpDate && form.meetUpTime
                        ? `${new Date(form.meetUpDate).toLocaleDateString()} at ${
                            (() => {
                              // First check standard time slots
                              const standardSlot = timeSlots.find((slot) => slot.value === form.meetUpTime);
                              if (standardSlot) {
                                return standardSlot.label;
                              }
                              
                              // If not found and it's a custom slot (custom-X), find the original time from availableSchedules
                              if (form.meetUpTime && form.meetUpTime.startsWith('custom-')) {
                                const schedules = order.available_schedules || order.availableSchedules || [];
                                const availableTimes = schedules.find((sched) => sched.date === form.meetUpDate)?.times || [];
                                const customIndex = parseInt(form.meetUpTime.split('-')[1]);
                                const customTimes = availableTimes.filter(time => 
                                  !timeSlots.some(slot => 
                                    slot.value === time || 
                                    slot.label === time ||
                                    slot.label.replace(/\s+/g, ' ').trim() === time.replace(/\s+/g, ' ').trim()
                                  )
                                );
                                return customTimes[customIndex] || form.meetUpTime;
                              }
                              
                              return form.meetUpTime;
                            })()
                          }`
                        : "N/A"}
                    </strong>
                  </p>
                  <p className="text-sm text-gray-800">
                    Meet Up Location:{" "}
                    <strong>{form.meetUpLocation || "N/A"}</strong>
                  </p>
                </>
              )}
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
          className="bg-primary-red text-white px-6 py-2 rounded-full font-semibold hover:bg-hover-red disabled:bg-gray-300 disabled:text-gray-500"
          onClick={() => {
            if (!isFormValid) return;
            setShowModal(true);
          }}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "Placing Order..." : "Place Order"}
        </button>
      </div>
      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!isSubmitting) {
            setShowModal(false);
            setModalStep("confirm");
            setSubmitError(null);
          }
        }}
        title={modalStep === "confirm" ? "Confirm Order" : "Order Confirmed"}
        description={
          modalStep === "confirm"
            ? "Are you sure you want to place this order? Please review your details before confirming."
            : submitError
            ? `Error: ${submitError}`
            : "Your order has been placed successfully!"
        }
        type={modalStep === "confirm" ? "confirm" : submitError ? "error" : "alert"}
        onConfirm={() => {
          if (modalStep === "confirm") {
            handleCreateOrder();
          } else {
            setShowModal(false);
            setModalStep("confirm");
            setSubmitError(null);
            onClose();
          }
        }}
        isLoading={isSubmitting}
      ></Modal>
    </div>
  );
}

const Container = ({ children }) => (
  <div className="w-full relative rounded-xl bg-white shadow-light flex flex-col text-left justify-center items-center">
    <div className="w-full space-y-6 px-10 py-8">{children}</div>
  </div>
);
