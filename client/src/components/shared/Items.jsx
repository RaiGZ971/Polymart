export default function Items({ order }) {
  const items = order?.productsOrdered || order?.items || [];

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Check if productPriceOffer exists on the order
  const isPendingOffer = !!order?.productPriceOffer;

  // Use quantity from order or from first item (fallback)
  const quantity = order?.quantity || (items[0]?.quantity ?? 1);

  // Calculate offer total if pending offer
  const offerTotal = isPendingOffer
    ? Number(order.productPriceOffer) * Number(quantity)
    : 0;

  return (
    <div className="w-full flex flex-col space-y-4 justify-between">
      <div className="w-full flex flex-row justify-between items-center">
        <p className="text-primary-red font-bold text-base mb-1 space-y-1">
          Items
        </p>
        <p className="text-primary-red font-bold text-base mb-1 space-y-1">
          Quantity
        </p>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-row gap-4 items-center w-full">
          <div>
            <img
              src={item.image}
              alt={item.name}
              className="w-24 aspect-square rounded-2xl object-cover"
            />
          </div>
          <div className="flex flex-row justify-between items-center w-full">
            <div className="flex flex-col">
              <p className="text-gray-800 font-semibold">{item.name}</p>
              <p className="text-primary-red text-lg font-bold">
                {isPendingOffer
                  ? `PHP ${order.productPriceOffer} x ${quantity}`
                  : `PHP ${item.price}`}
              </p>
            </div>
            <div className="items-center flex flex-row">x {item.quantity}</div>
          </div>
        </div>
      ))}
      <div className="w-full flex flex-row justify-between items-center mt-2">
        <h1 className="text-2xl font-semibold">
          {isPendingOffer ? "Pending Offer" : "Total"}
        </h1>
        <h1 className="text-2xl font-bold text-primary-red">
          {isPendingOffer ? `PHP ${offerTotal}` : `PHP ${total}`}
        </h1>
      </div>
    </div>
  );
}
