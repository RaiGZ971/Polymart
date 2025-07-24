export default function FeatureShowcase({ features }) {
  return (
    <section className="space-y-20 mb-20">
      <div className="flex flex-col w-full bg-[#730C0C] py-16 px-16 space-y-6">
        <div className="flex flex-col items-center space-y-1">
          <div className="flex text-white text-6xl gap-2 items-center justify-center">
            <div className="font-bold">Features</div>
            <div className="italic">built for</div>
            <div className="text-[#FFE387] font-bold">PUPians</div>
          </div>
          <div className="text-xl text-white">
            Everything you need to hustle, connect, and transact within campus.
          </div>
        </div>
        <div className="text-white italic text-xs">
          Got suggestions?{" "}
          <span className="underline hover:text-[#FFE387]">Contact Us</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-40 py-10">
        {features.map((feature, index) => (
          <div key={index} className="flex flex-col items-center space-y-6">
            <div className="w-40 h-40 rounded-full bg-white flex items-center justify-center shadow-glow">
              <img
                src={feature.icon}
                alt={feature.label}
                className="w-20 h-20 object-contain"
              />
            </div>
            <p className="text-center text-[#950000] text-3xl font-semibold">
              {feature.label}
            </p>
            <p className="text-center text-black text-xs md:text-sm max-w-[210px]">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
