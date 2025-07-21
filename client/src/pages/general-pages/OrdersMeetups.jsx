import { useState } from "react";
import { MainDashboard, OrdersListingsComponent, DropdownFilter } from "../../components";
import ProductDetail from "../../components/listing/ProductDetail";
import ordersSampleData from "../../data/ordersSampleData";
import orderStatus from "../../data/orderStatus";
import { meetUpLocationsFilter } from "../../data";

export default function OrdersMeetups() {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(orderStatus[0].value);
    const [selectedLocation, setSelectedLocation] = useState(meetUpLocationsFilter[0]?.value || "");
    const [activeTab, setActiveTab] = useState("orders"); // "orders" or "listings"

    const handleBack = () => setSelectedOrder(null);

    const handleStatusChange = (value) => {
        setSelectedStatus(value);
    };

    const handleLocationChange = (value) => {
        setSelectedLocation(value);
    };

    // Filter data based on activeTab, selectedStatus, and selectedLocation
    const filteredData = ordersSampleData.filter(order => {
        // Tab filter
        const tabMatch = activeTab === "orders" ? order.role === "user" : order.role !== "user";
        // Status filter (normalize to lowercase)
        const statusMatch =
            selectedStatus === "all" ||
            (order.status && order.status.toLowerCase() === selectedStatus.toLowerCase());
        // Location filter (normalize to lowercase)
        const locationMatch =
            selectedLocation === "all" ||
            (order.location && order.location.toLowerCase() === selectedLocation.toLowerCase());
        return tabMatch && statusMatch && locationMatch;
    });

    return (
        <MainDashboard>
            <div className="flex flex-col w-[80%] min-h-screen mt-10 justify-center">
                <h1 className="text-left mb-6 font-bold text-4xl text-primary-red">Orders & Meet Ups</h1>
                <div className="w-full items-center space-y-6">
                    <nav className="flex flex-row border-b-2 border-gray-300 pb-4 justify-between">
                        <div className="flex flex-row gap-4">
                            <button
                                className={`font-semibold ${activeTab === "orders" ? "text-primary-red underline" : "text-gray-400 hover:text-primary-red"}`}
                                onClick={() => setActiveTab("orders")}
                            >
                                Your Orders (5)
                            </button>
                            <span className="font-semibold text-gray-400">|</span>
                            <button
                                className={`font-semibold ${activeTab === "listings" ? "text-primary-red underline" : "text-gray-400 hover:text-primary-red"}`}
                                onClick={() => setActiveTab("listings")}
                            >
                                From Your Listings (10)
                            </button>
                        </div>
                        <div className="flex flex-row gap-4">
                            <DropdownFilter
                                options={meetUpLocationsFilter}
                                value={selectedLocation}
                                onChange={handleLocationChange}
                                selectedOption={selectedLocation}
                                labelPrefix="Location"
                                placeholder="All"
                            />

                            <DropdownFilter
                                options={orderStatus}
                                value={selectedStatus}
                                onChange={handleStatusChange}
                                selectedOption={selectedStatus}
                                labelPrefix="Status"
                                placeholder="All"
                            />
                        </div>
                    </nav>
                    {selectedOrder ? (
                        <ProductDetail order={selectedOrder} onBack={handleBack} />
                    ) : (
                        filteredData.length > 0 ? (
                            filteredData.map((order, idx) => (
                                <div key={idx} onClick={() => setSelectedOrder(order)}>
                                    <OrdersListingsComponent {...order} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 py-10 text-lg font-semibold">
                                No matches for your filters.
                            </div>
                        )
                    )}
                </div>
            </div>
        </MainDashboard>
    );
}