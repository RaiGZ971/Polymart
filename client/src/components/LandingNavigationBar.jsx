import Logo from '../assets/PolymartLogo.png';

export default function LandingNavigationBar() {
    const navItems = ['HOME', 'ABOUT', 'FAQs', 'CONTACT'];

    return (
        <div className='pl-24 pr-24 w-full justify-between flex items-center bg-white'>
            <img src={Logo} alt="Polymart Logo" className="min-w-[148px] max-w-[148px] min-h-[50px] max-h-[50px] mx-4" />

            <nav className='flex items-center'>
                <ul className='flex gap-8 text-sm font-montserrat items-center'>
                    {navItems.map((item, index) => (
                        <li key={index} className='hover:text-[#950000] cursor-pointer'>
                            {item}
                        </li>
                    ))}
                </ul>
                <button className='bg-[#950000] text-white px-8 py-2 rounded-[30px] shadow-sm hover:bg-[#730C0C] ml-8'>
                    Sign Up
                </button>
            </nav>
        </div>
    );
}