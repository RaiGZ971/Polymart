import { ChevronLeft } from "lucide-react";

export default function ProductDetail({ order, onBack }) {
    if (!order) return null;

    return (
        <>
            <div 
                className='absolute left-6 text-gray-400 font-regular text-sm cursor-pointer hover:text-primary-red transition-colors'
                onClick={onBack}
            >
                <ChevronLeft size={24} className='inline' /> 
                Back
            </div>
            <div className="p-8 bg-white rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold mb-4">{order.productName}</h1>
                <img src={order.productImage} alt={order.productName} className="w-48 h-48 object-cover rounded-lg mb-4" />
                <p>Status: {order.status}</p>
                <p>Price: PHP {order.productPrice}</p>
                <p>Items Ordered: {order.itemsOrdered}</p>
                <p>Buyer: {order.username}</p>
                <p>Payment: {order.paymentMethod}</p>
                <p>Schedule: {order.schedule}</p>
                <p>Location: {order.location}</p>
                <p>Remarks: {order.remark || "None"}</p>
            </div>
        </>
    );
}