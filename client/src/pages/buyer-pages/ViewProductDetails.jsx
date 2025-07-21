import { useState } from "react";
import { MainDashboard } from "../../components";
import ReviewComponent from "../../components/ratings/ReviewComponent";
import { QuantityPicker } from "../../components";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function ViewProductDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const order = location.state?.order; // This will be one of the ordersSampleData objects
    const [quantity, setQuantity] = useState(1);

    if (!order) {
        return (
            <MainDashboard>
                <div className="w-full flex justify-center items-center min-h-screen">
                    <p className="text-lg text-gray-500">No product data found.</p>
                </div>
            </MainDashboard>
        );
    }

    return (
        <MainDashboard>
            {/* Back Button */}
            <div className="w-[80%] mt-10 flex items-center cursor-pointer select-none" onClick={() => navigate(-1)}>
                <ChevronLeft size={24} className="text-primary-red" />
                <span className="ml-2 text-primary-red font-semibold hover:underline">Back</span>
            </div>
            {/*Main Container*/}
            <div className="flex flex-col w-[80%] min-h-screen mt-4 justify-center">
                <div className="flex flex-row gap-2">
                    {/*Left Column*/}
                    <div className="w-1/2">
                        <img
                            src={order.productImage}
                            alt={order.productName}
                            className="w-96 h-96 rounded-xl object-cover"
                        />
                        <div className="mt-4 space-y-4">
                            {order.reviews && order.reviews.length > 0 ? (
                                order.reviews.map((review, idx) => (
                                    <ReviewComponent key={idx} review={review} />
                                ))
                            ) : (
                                <p className="text-gray-500">No reviews yet.</p>
                            )}
                        </div>
                    </div>
                    {/*Right Column*/}
                    <div className="w-1/2 text-left">
                        <p>Category</p>
                        <h1>{order.productName}</h1>
                        <div>
                            <h2>PHP {order.productPrice}</h2>
                        </div>
                        <p>Product Description</p>
                        <p>
                            {order.productDescription ||
                                "No description provided."}
                        </p>
                        <p>Availability: {order.stock ?? 20} in stock</p>
                        <p>Item Quantity: </p>
                        <QuantityPicker value={quantity} min={1} max={order.stock ?? 20} onChange={setQuantity} />
                        <button className="hover:bg-primary-red hover:text-white px-4 py-2 rounded-full bg-white border-2 border-primary-red transition-colors text-primary-red font-bold w-full">
                            Place Order
                        </button>
                    </div>
                </div>
            </div>
        </MainDashboard>
    );
}