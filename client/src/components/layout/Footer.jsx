import { Facebook, Mail, Github } from "lucide-react";

export default function Footer({ variant = "light", className = "" }) {
  const variants = {
    light: {
      container: "bg-white text-black",
      text: "text-black",
      hover: "hover:underline hover:text-gray-600",
    },
    dark: {
      container: "bg-secondary-red text-white",
      text: "text-white",
      hover: "hover:underline hover:text-gray-300",
    },
  };

  const currentVariant = variants[variant];

  return (
    <footer
      className={`${currentVariant.container} py-10 px-10 text-left ${className}`}
    >
      <div className="w-full h-full mx-auto grid grid-cols-3 gap-10 text-sm">
        {/* Customer Service */}
        <div>
          <h3 className={`font-bold mb-4 uppercase ${currentVariant.text}`}>
            Customer Service
          </h3>
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className={`${currentVariant.text} ${currentVariant.hover}`}
              >
                Terms & Conditions
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`${currentVariant.text} ${currentVariant.hover}`}
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`${currentVariant.text} ${currentVariant.hover}`}
              >
                Community Rules
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`${currentVariant.text} ${currentVariant.hover}`}
              >
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        {/* About Polymart */}
        <div>
          <h3 className={`font-bold mb-4 uppercase ${currentVariant.text}`}>
            About Polymart
          </h3>
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className={`${currentVariant.text} ${currentVariant.hover}`}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`${currentVariant.text} ${currentVariant.hover}`}
              >
                About Us
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`${currentVariant.text} ${currentVariant.hover}`}
              >
                FAQs or "How It Works"
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`${currentVariant.text} ${currentVariant.hover}`}
              >
                Campus Exclusivity
              </a>
            </li>
          </ul>
        </div>

        {/* Follow Us */}
        <div>
          <h3 className={`font-bold mb-4 uppercase ${currentVariant.text}`}>
            Follow Us
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center space-x-2">
              <i
                className={`bi bi-facebook text-xl ${currentVariant.text}`}
              ></i>
              <a
                href="#"
                className={`${currentVariant.text} ${currentVariant.hover}`}
              >
                Facebook
              </a>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className={`w-5 h-5 ${currentVariant.text}`} />
              <a
                href="#"
                className={`${currentVariant.text} ${currentVariant.hover}`}
              >
                Email Us
              </a>
            </li>
            <li className="flex items-center space-x-2">
              <i className={`bi bi-github text-xl ${currentVariant.text}`}></i>
              <a
                href="#"
                className={`${currentVariant.text} ${currentVariant.hover}`}
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
