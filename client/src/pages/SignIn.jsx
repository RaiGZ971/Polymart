import { NavigationBar } from "../components";
import stall from "../assets/stall.png";

export default function SignIn() {
    return (
      <div className='w-full h-screen bg-white flex flex-col items-center'>
         <div className="w-full p-10 px-0 mx-0">
            <NavigationBar />
        </div>
        
        <div className='w-full flex items-center justify-center px-8 py-16 gap-16'>
            {/* Left Container */}
            <div className='max-w-[420px]'>
                <img src={stall} alt="Stall" className='w-full h-auto' />
            </div>
            {/* Right Container */}
            <div className='max-w-[420px] flex flex-col items-center'>
                <div className="border-2 border-primary-red">
                    
                </div>
            </div>

        </div>
    </div>
    );
    }