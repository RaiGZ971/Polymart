import { NavigationBar, Footer, Textfield } from "../components";
import stall from "../assets/stall.png";

export default function SignIn() {
    return (
      <div className='w-full h-screen bg-white flex flex-col items-center font-montserrat'>
         <div className="w-full p-10 px-0 mx-0">
            <NavigationBar />
        </div>
        
        <div className='w-full flex items-center justify-center px-8 pt-10 pb-20 gap-16'>
            {/* Left Container */}
            <div className='max-w-[420px] -ml-12'>
                <img src={stall} alt="Stall" className='w-full h-auto' />
            </div>
            {/* Right Container */}
            <div className='max-w-[420px] flex flex-col items-center'>
                <div className="border-2 border-primary-red rounded-[30px] p-10 shadow-lg w-full space-y-3">
                    <div className="space-y-0 mb-4">
                        <h1 className="text-3xl font-bold text-primary-red">Kamusta, Iskolar?</h1>
                        <p className="text-sm">Sa PolyMart lahat ng Isko, may pwesto!</p>
                    </div>
                    <form className="flex flex-col space-y-4">
                        <Textfield
                            label="Student ID"
                            name="studentId"
                            type="text"
                        />

                        <Textfield
                            label="Password"
                            name="password"
                            type="password" 
                        />
                        
                        <a href="/forgot-password" className="text-gray-500 hover:underline text-xs text-right">Forgot Password?</a>
                        <button
                            type="submit"
                            className="bg-hover-red text-white rounded-[30px] px-2 py-3 shadow-sm font-semibold hover:bg-secondary-red transition-colors"
                        >
                            Sign In
                        </button>

                        <div className="flex items-center space-x-4">
                            <hr className="flex-1 border-gray-300" />
                            <p className="text-gray-500">or continue with</p>
                            <hr className="flex-1 border-gray-300" />
                        </div>

                        <button
                            type="button"
                            className="bg-white border-2 border-primary-red text-primary-red rounded-[30px] font-semibold p-2 hover:bg-hover-red hover:text-white transition-colors"
                        >
                            Continue with Google
                        </button>

                        <p className="text-sm text-gray-500">
                            Not part of the community yet? <a href="/signup" className="text-primary-red hover:underline">Sign Up</a>
                        </p>

                    </form>
                </div>
            </div>

        </div>
        <Footer variant="dark" className="w-full" />
    </div>
    );
    }