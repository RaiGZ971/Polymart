import { useState } from "react";
import { MainDashboard } from "../../components";
import ReviewComponent from "../../components/ratings/ReviewComponent";
import { QuantityPicker } from "../../components";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Flag, Heart, ShoppingBag } from "lucide-react";
import productCategories from "../../data/productCategories";
import StaticRatingStars from "../../components/shared/StaticRatingStars";

const getCategoryLabel = (value) => {
    const found = productCategories.find(cat => cat.value === value);
    return found ? found.label : value;
};

export default function ViewProductDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const order = location.state?.order;
    const [quantity, setQuantity] = useState(1);

    // Calculate average rating from reviews
const averageRating =
  order.reviews && order.reviews.length > 0
    ? Math.round(
        order.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
          order.reviews.length
      )
    : 0;

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
            <div className="w-[80%] mt-10 flex cursor-pointer select-none" onClick={() => navigate(-1)}>
                <ChevronLeft size={24} className="text-primary-red" />
                <span className="ml-2 text-primary-red font-semibold hover:underline">Back</span>
            </div>
            {/*Main Container*/}
            <div className="flex flex-col w-[80%] min-h-screen mt-5">
                <div className="flex flex-row gap-10">
                    {/*Left Column*/}
                    <div className="w-1/2">
                        <img
                            src={order.productImage}
                            alt={order.productName}
                            className="w-full h-[480px] rounded-xl object-cover"
                        />

                        <div className="flex flex-row items-end justify-between mt-4">
                            <h1 className="font-bold text-3xl text-primary-red text-left">Reviews:</h1>
                            <p className="text-gray-500 text-sm">{order.reviews ? order.reviews.length : 0} reviews | {order.sold} items sold</p>
                        </div>
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
                    <div className="w-1/2 text-left space-y-5">
                        <div className="flex flex-col gap-2">
                            {/* Title & Category */}
                            <div>
                                <div className="flex flex-row justify-between">
                                    <p className="text-primary-red text-base">{getCategoryLabel(order.category)}</p>
                                    <button className="text-sm group hover:text-primary-red hover:underline">
                                        <Flag size={20} className="inline pr-1 group-hover:text-primary-red"/>
                                        Report
                                    </button>
                                </div>
                                <h1 className="text-4xl flex flex-wrap font-bold">{order.productName}</h1>
                            </div>
                            {/* Price & Average Rating */}
                            <div className="flex flex-row items-center justify-between">
                                <h2 className="text-3xl font-bold text-primary-red">PHP {order.productPrice}</h2>
                                <div className="flex flex-col items-end">
                                    <StaticRatingStars value={averageRating} />
                                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{averageRating} stars | {order.sold} reviews</p>
                                </div>
                            </div>
                            {/* Product Description */}
                            <div className="flex flex-col gap-1">
                                <p className="text-base font-semibold text-primary-red">Product Description</p>
                                <p className="text-sm text-gray-800">
                                    {order.productDescription ||
                                        "No description provided."}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                        {/* User Actions */}
                        <div className="flex flex-row gap-1 text-base">
                            <p className="font-semibold text-primary-red">Availability:</p> 
                            <p className=" text-gray-800">{order.stock ?? 20} in stock</p>
                        </div>
                            <div className="flex flex-row gap-2 text-base">
                                <p className="font-semibold text-primary-red">Item Quantity: </p>
                                <QuantityPicker value={quantity} min={1} max={order.stock ?? 20} onChange={setQuantity} />
                            </div>
                        </div>
                        <button className="hover:bg-primary-red hover:text-white px-4 py-2 rounded-full bg-white border-2 
                        border-primary-red transition-colors text-primary-red font-bold w-full">
                            Place Order
                        </button>
                        <div className="flex flex-row gap-4 items-center">
                            <button className="text-sm group hover:text-primary-red hover:underline">
                                <Heart size={20} className="inline pr-1 group-hover:text-primary-red"/>
                                Add to Favorites
                            </button>

                            <button className="text-sm group hover:text-primary-red hover:underline">
                                <ShoppingBag size={20} className="inline pr-1 group-hover:text-primary-red"/>
                                Add to Bag
                            </button>
                            {/* User Actions End */}
                            
                        </div>
                    </div>
                </div>
            </div>
        </MainDashboard>
    );
}
