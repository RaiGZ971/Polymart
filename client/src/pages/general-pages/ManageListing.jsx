import { MainDashboard } from "../../components";
import DashboardBackButton from "../../components/ui/DashboardBackButton";

export default function ManageListing() {
  return (
    <MainDashboard>
      <DashboardBackButton />
      
      <div className="w-[80%] mt-5 flex flex-col items-center justify-center min-h-[400px]">
        <h1 className="text-4xl font-bold text-primary-red mb-8">Manage Listing</h1>
        <div className="text-lg text-gray-500">
          Manage Listing page coming soon...
        </div>
      </div>
    </MainDashboard>
  );
}
