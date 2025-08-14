import { MainDashboard } from "../../components";
import DashboardBackButton from "../../components/ui/DashboardBackButton";

export default function Help() {
  return (
    <MainDashboard>
      <DashboardBackButton />
      
      <div className="w-[80%] mt-5 flex flex-col items-center justify-center min-h-[400px]">
        <h1 className="text-4xl font-bold text-primary-red mb-8">Help</h1>
        <div className="text-lg text-gray-500">
          Help page coming soon...
        </div>
      </div>
    </MainDashboard>
  );
}
