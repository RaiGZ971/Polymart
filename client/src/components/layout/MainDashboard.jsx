import { NavigationDashboard, Footer } from '..';

export default function MainDashboard({ children }) {
    return (
        <>
        <div className="min-h-screen bg-white flex flex-col items-center mb-20">
            <div className="w-full px-0 mx-0">
                <NavigationDashboard />
            </div>
            <div className="w-full flex-1 flex flex-col items-center">
                {children}
            </div>
        </div>
        <Footer variant='dark' />
        </>
    );
}