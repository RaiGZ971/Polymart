export default function MeetUpDetails({ order, title }) {
  return (
    <div>
      <p className="text-primary-red font-bold text-base mb-1 space-y-1">
        {title ? title : "Meet Up Details"}
      </p>
      <p className="text-sm text-gray-800">
        Date Placed: <strong>{order.datePlaced}</strong>
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
        Proposed By: <strong>{order.proposed_by ? (order.proposed_by === 'buyer' ? 'Buyer' : 'Seller') : 'Buyer'}</strong>
      </p>
      <p className="text-sm text-gray-800">
        Remark: <strong>{order.remark || "None"}</strong>
      </p>
      <p className="text-sm text-gray-800">
        Number of Items: <strong>{order.itemsOrdered}</strong>
      </p>
    </div>
  );
}
