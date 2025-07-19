import { NavigationBar, Footer } from '../components';
import { Brain, Palette, Pencil, Laptop, Shirt, Cherry, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef } from 'react';

import { 
  stall, 
  featureStar, 
  location, 
  chat, 
  verified 
} from '../assets';

export default function LandingPage() {
    const header = "Sa Polymart, lahat ng Isko may pwesto!";
    const description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ";
    const goals = [
        {
            title: "A Student-Friendly Marketplace for PUPian-Owned Hustles",
            icon: featureStar // instead of Star
        },
        {
            title: "Campus-Centric Meet-Ups for Convenience & Safety",
            icon: featureStar // instead of Star
        },
        {
            title: "Exclusive to PUPians Only",
            icon: featureStar // instead of Star
        }
    ];

    const productInformation = [
        { title: "Academics Essentials",
        description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        icon: Brain,
        },

        { title: "Creative Works",
            description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
            icon: Palette,
        },    
        
        { title: "Services",
        description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        icon: Pencil,
        },

        { title: "Tech & Gadgets",
            description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
            icon: Laptop,
        },
        
        { title: "Fashion",
        description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        icon: Shirt,
        },

        { title: "At Kung Anik-Anik!",
            description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
            icon: Cherry,
        },
    ]

   const features = [
  {
    icon: location, // instead of Location
    label: "Set a meet up",
    description: "Coordinate safe and convenient meet-ups within PUP using location pins and suggested common spots — no deliveries needed.",
  },
  {
    icon: chat, // instead of Chat
    label: "Chat System",
    description: "Message buyers or sellers directly to ask questions, finalize details, and stay updated — all within the platform.",
  },
  {
    icon: verified, // instead of Verified
    label: "Verified Users",
    description: "Only PUP-verified students can create listings or transact, ensuring a trusted and secure campus-exclusive marketplace.",
  },
    ]

    const faqslist = [
        {
            question: "What is PolyMart?",
            answer: "PolyMart is a campus-exclusive marketplace designed for PUP students to buy and sell products and services, fostering a community of PUPians.",
        },
        {
            question: "What can I sell on PolyMart?",
            answer: "You can sell a wide range of products and services, including academic essentials, creative works, tech gadgets, fashion items, and more, as long as you are a PUP student.",
        },
        {
            question: "What is not allowed on PolyMart?",
            answer: "ANSWER"
        },
        {
            question: "Is there any payment system inside the app?",
            answer: "ANSWER"
        },
        {
            question: "What if I encounter a bogus buyer or seller?",
            answer: "ANSWER"
        },
        {
            question: "Do accounts expire when I graduate?",
            answer: "ANSWER"
        },
    ]
   
  return (
    <>
    {/* Main Container */}
    <div className='w-full overflow-x-hidden'>
    
    {/* Navigation Bar */}
    <div className="w-full p-10 px-0 mx-0">
        <NavigationBar variant="landing"/>
    </div>

    {/* Content Area */}
    <div className='font-montserrat'>
        {/* PolyMart Information */}
        <section id="home">
        <div className='w-full flex items-center justify-center px-8 py-16 gap-16'>
        {/* Left Container */}
        <div className='max-w-[600px] space-y-6'> 
            <h1 className='text-[55px] font-bold justify-start text-left text-[#950000] leading-tight'>{header}</h1>
            <p className='text-base mt-4 text-left justify-start'>{description}</p>
            
            <div className='flex gap-8 items-center justify-start'>
                <button className='bg-[#950000] font-bold text-white px-8 py-2 rounded-[30px] shadow-sm hover:bg-[#730C0C]'>
                    JOIN THE COMMUNITY
                </button>
                <p className='underline hover:text-[#950000]'>Learn More</p>
            </div>
        </div>    

        {/* Right Container */}
        <div className='max-w-[420px]'>
            <img src={stall} alt="Stall" className='w-full h-auto' />
        </div>
        </div>
        </section>
        {/* End of PolyMart Information */}

        {/* Goals Section */}
        <section id="about">
        <div className='flex w-full bg-[#730C0C] py-16 px-8'>
            {/*Left Container*/}
            <div className='max-w-[600px] mx-auto mb-8 justify-start'>
                <h2 className='text-white text-[64px] font-bold max-w-[334px] leading-tight text-left'>What <span className='text-[#FFE387]'>PolyMart</span> Offers</h2>
                <p className='text-left text-base italic text-white'>A platform by PUPians for PUPians</p>
            </div>
            
            {/* Vertical Divider */}
            <div className='h-64 border-l-2 rounded-full border-white mx-8'></div>

            {/* Right Container */}
            <div className='flex flex-col justify-center gap-4 max-w-[386px] mx-auto'>
                {goals.map((feature, index) => (
                    <div key={index} className='flex items-center gap-4 justify-start text-left'>
                        <img src={feature.icon} alt={feature.title} className='w-16 h-16' />
                        <h3 className='text-white text-lg'>{feature.title}</h3>
                    </div>
                ))}
            </div>
        </div>
        </section>
        {/* End of Goals Section */}

        {/* Product Categories */}
        <div className='w-full flex flex-col items-center justify-center px-6 py-16 m-10'>
            <h1 className='text-5xl text-[#950000] font-bold mb-8'>PRODUCT CATEGORIES</h1>
            <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-2 sm:grid-cols-1 px-4 py-8">
            {productInformation.map((item, index) => (
                <ProductCategory
                key={index}
                title={item.title}
                description={item.description}
                Icon={item.icon}
                />
            ))}
            </div>
        </div>
        {/* End of Product Categories */}

        {/* Features Section */}
        <div className='space-y-20 mb-20'>
            {/* Header Section */}
            <div className='flex flex-col w-full bg-[#730C0C] py-16 px-16 space-y-6'>
                <div className='flex flex-col items-center justify-center space-y-1'>
                    <div className='flex flex-row text-white text-6xl gap-2 items-center justify-center mx-auto'>
                        <div className='font-bold'>Features</div> 
                        <div className='italic'>built for</div>  
                        <div className='text-[#FFE387] font-bold'>PUPians</div>
                    </div>
                    <div className='text-xl text-white'>Everything you need to hustle, connect, and transact within campus.</div>
                </div>
                <div className='text-white italic text-xs'>Got suggestions? <span className='italic bold underline hover:text-[#FFE387]'>Contact Us</span></div>
            </div>

        {/* Features Icons */}
        <div className="flex flex-wrap justify-center gap-40 py-10">
            {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center space-y-6">
                {/* Circle container */}
                <div className="w-40 h-40 rounded-full bg-white flex items-center justify-center shadow-glow">
                    <img
                    src={feature.icon}
                    alt={feature.label}
                    className="w-20 h-20 object-contain" // Icon Size
                    />
                </div>

                {/* Label */}
                <p className="text-center text-[#950000] text-3xl font-semibold">
                    {feature.label}
                </p>

                {/* Description */}
                <p className="text-center text-black text-xs md:text-sm max-w-[210px]">
                    {feature.description}
                </p>
                </div>
            ))}
            </div>
        </div>

        {/* End of Features Section */}

        {/* FAQS */}
       <section id="faqs">
        <div className='flex flex-col w-full bg-[#730C0C] py-16 px-16 space-y-6'>
            <div className="px-24">
                <div className='text-left text-3xl text-white font-bold mb-6'>Frequently Asked Questions</div>
                {faqslist.map((item, index) => (
                    <FAQItem key={index} question={item.question} answer={item.answer} />
                ))}
            </div>
        </div>
        </section>
        {/* End of FAQS */}

        {/* Footer */}
        <Footer className="w-full" />
    </div>
    </div>
    </>
  );
}

{/* ProductCategory Component */}
function ProductCategory({ title, description, Icon }) {
    return (
        <div className="border-2 border-[#950000] rounded-[20px] p-6 text-left max-w-md mx-auto hover:scale-105 transition-transform duration-300">
        <div className="flex items-center gap-2 -mt-10 bg-white px-3 w-fit ml-4">
            <Icon className="text-[#950000] w-5 h-5" />
            <h3 className="text-[#950000] font-bold text-lg">{title}</h3>
        </div>
        <p className="mt-4 text-sm text-gray-700">{description}</p>
        </div>
    );
    }

{/* FAQItem Component */}
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-4 border-b border-white/20">
      <button
        className="flex justify-between items-center w-full text-left transition-colors duration-200 hover:text-[#FFE387]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg text-white">★  {question}</span>
        <ChevronDown 
          className={`text-white w-5 h-5 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
      }`}>
        <div className="text-white text-base text-left italic pb-2">
          {answer}
        </div>
      </div>
    </div>
  );
}
