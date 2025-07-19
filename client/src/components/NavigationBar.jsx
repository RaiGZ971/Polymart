import Logo from '../assets/PolymartLogo.png';

export default function NavigationBar({ 
    variant = 'landing', 
    navItems = [], 
    showSignUpButton = true,
    onSignUpClick,
    onLogoClick,
    currentUser = null 
}) {
    const defaultNavItems = {
        landing: [
            { name: 'HOME', id: 'home' },
            { name: 'ABOUT', id: 'about' },
            { name: 'FAQs', id: 'faqs' },
        ],
        signup: [
            { name: 'Having trouble?', href: '/' },
        ],
    };

    const handleNavClick = (item) => {
        if (item.id) {
            // For anchor scrolling (landing page)
            const element = document.getElementById(item.id);
            if (element) {
                element.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        } else if (item.href) {
            // For navigation to different pages
            window.location.href = item.href;
        } else if (item.onClick) {
            // For custom click handlers
            item.onClick();
        }
    };

    const handleLogoClick = () => {
        if (onLogoClick) {
            onLogoClick();
        } else if (variant === 'landing') {
            const homeElement = document.getElementById('home');
            if (homeElement) {
                homeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            window.location.href = '/';
        }
    };

    const items = navItems.length > 0 ? navItems : defaultNavItems[variant];

    const renderRightSection = () => {
        switch (variant) {
            case 'landing':
                return showSignUpButton && (
                    <button 
                        className='bg-[#950000] text-white px-8 py-2 rounded-[30px] shadow-sm hover:bg-[#730C0C] ml-8'
                        onClick={onSignUpClick || (() => window.location.href = '/signup')}
                    >
                        Sign Up
                    </button>
                );
            
            case 'signup':
                return (
                     <button 
                        className='bg-[#950000] text-white px-8 py-2 rounded-[30px] shadow-sm hover:bg-[#730C0C] ml-8'
                        onClick={onSignUpClick || (() => window.location.href = '/signup')}
                    >
                        Sign In
                    </button>
                );
            
            
            default:
                return null;
        }
    };

    return (
        <div className='pl-24 pr-24 w-full justify-between flex items-center bg-white'>
            <img 
                src={Logo} 
                alt="Polymart Logo" 
                className="min-w-[148px] max-w-[148px] min-h-[50px] max-h-[50px] mx-4 cursor-pointer" 
                onClick={handleLogoClick}
            />

            <nav className='flex items-center'>
                <ul className='flex gap-14 text-sm font-montserrat items-center'>
                    {items.map((item, index) => (
                        <li 
                            key={index} 
                            className='hover:text-[#950000] cursor-pointer'
                            onClick={() => handleNavClick(item)}
                        >
                            {item.name}
                        </li>
                    ))}
                </ul>
                {renderRightSection()}
            </nav>
        </div>
    );
}