import { MainDashboard } from "../../components";

export default function Profile() {
  return (
    <MainDashboard>
      <div className="w-[80%] mt-10 flex flex-col items-center justify-center min-h-[400px]">
        <h1 className="text-4xl font-bold text-primary-red mb-8">Profile</h1>
        <div className="text-lg text-gray-500">
          Profile page coming soon...
        </div>
      </div>
    </MainDashboard>
  );
}
