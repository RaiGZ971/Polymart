import stall from "@/assets/stall.png";
import Button from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";

export default function HeroSection({ header, description }) {
  const navigate = useNavigate();

  return (
    <section id="home">
      <div className="w-full flex flex-row md:flex-nowrap items-center justify-center text-left px-8 py-16 gap-16">
        {/* Left */}
        <div className="w-full md:max-w-[600px] space-y-6">
          <h1 className="text-[40px] md:text-[55px] font-bold text-hover-red leading-tight">
            {header}
          </h1>
          <p className="text-base mt-4 text-wrap break-words">{description}</p>
          <div className="flex gap-8 items-center">
            <Button variant="darkred" onClick={() => navigate("/signup")}>
              JOIN THE COMMUNITY
            </Button>
            <p className="underline hover:text-hover-red">Learn More</p>
          </div>
        </div>
        {/* Right */}
        <div className="w-full md:max-w-[420px]">
          <img src={stall} alt="Stall" className="w-full h-auto" />
        </div>
      </div>
    </section>
  );
}
