import { useState } from "react";
import { MainDashboard } from "../../components";
import ReviewComponent from "../../components/ratings/ReviewComponent";
import { reviewData } from "../../data/reviewData";

export default function TestPage() {
    return (
        <>
            <MainDashboard>
                {/*Main Container*/}
                <div className="flex flex-col w-[80%] min-h-screen mt-10 justify-center">
                    <div className="flex flex-row gap-2">
                        {/*Left Column*/}
                        <div className="w-1/2">
                            <img
                                src="https://picsum.photos/201/150"
                                alt="No Orders Placeholder"
                                className="w-96 h-96 rounded-xl"
                            />
                            <div className="mt-4 space-y-4">
                                {reviewData.map((review, idx) => (
                                    <ReviewComponent key={idx} review={review} />
                                ))}
                            </div>
                        </div>
                        {/*Right Column*/}
                        <div className="w-1/2 text-left">
                            <p>Category</p>
                            <h1>Crocheted Photocard Holder</h1>
                            <div>
                                <h2>PHP 300</h2>
                            </div>
                            <p>Product Description</p>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                            <p>Availability: 20 in stock</p>
                            <p>Item Quantity: </p>
                            <button className="hover:bg-primary-red hover:text-white px-4 py-2 rounded-full bg-white border-2 border-primary-red transition-colors text-primary-red font-bold w-full">
                                Place Order
                            </button>
                        </div>
                    </div>
                </div>
            </MainDashboard>
        </>
    );
}