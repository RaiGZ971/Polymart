export default function GoalsSection({ goals }) {
  return (
    <section id="about">
      <div className="flex w-full bg-[#730C0C] py-16 px-8 text-left ">
        <div className="max-w-[600px] mx-auto">
          <h2 className="text-white text-[64px] font-bold max-w-56 leading-tight">
            What <span className="text-[#FFE387]">PolyMart</span> Offers
          </h2>
          <p className="italic text-white">A platform by PUPians for PUPians</p>
        </div>
        <div className="h-64 border-l-2 rounded-full border-white mx-6"></div>
        <div className="flex flex-col justify-center gap-4 max-w-md mx-auto">
          {goals.map((goal, index) => (
            <div key={index} className="flex items-center gap-4">
              <img src={goal.icon} alt={goal.title} className="w-16 h-16" />
              <h3 className="text-white text-lg">{goal.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
