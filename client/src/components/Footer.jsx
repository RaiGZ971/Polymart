import { Facebook, Mail, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white text-black py-10 px-10 text-left">
      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-10 text-sm">
        {/* Customer Service */}
        <div>
          <h3 className="font-bold mb-4 uppercase">Customer Service</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Terms & Conditions</a></li>
            <li><a href="#" className="hover:underline">Privacy Policy</a></li>
            <li><a href="#" className="hover:underline">Community Rules</a></li>
            <li><a href="#" className="hover:underline">Contact Us</a></li>
          </ul>
        </div>

        {/* About Polymart */}
        <div>
          <h3 className="font-bold mb-4 uppercase">About Polymart</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Home</a></li>
            <li><a href="#" className="hover:underline">About Us</a></li>
            <li><a href="#" className="hover:underline">FAQs or “How It Works”</a></li>
            <li><a href="#" className="hover:underline">Campus Exclusivity</a></li>
          </ul>
        </div>

        {/* Follow Us */}
        <div>
          <h3 className="font-bold mb-4 uppercase">Follow Us</h3>
          <ul className="space-y-3">
            <li className="flex items-center space-x-2">
              <i className='bi bi-facebook text-xl'></i>
              <a href="#" className="hover:underline">Facebook</a>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <a href="#" className="hover:underline">Email Us</a>
            </li>
            <li className="flex items-center space-x-2">
              <i className='bi bi-github text-xl'></i>
              <a href="#" className="hover:underline">GitHub</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
