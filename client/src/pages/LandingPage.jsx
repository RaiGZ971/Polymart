import { NavigationBar, Footer } from "@/components";
import HeroSection from "@/components/landing/HeroSection";
import GoalsSection from "@/components/landing/GoalsSection";
import ProductCategories from "@/components/landing/ProductCategories";
import FeatureShowcase from "@/components/landing/FeatureShowcase";
import FAQSection from "@/components/landing/FAQSection";

import {
  header,
  description,
  goals,
  productInformation,
  features,
  faqslist,
} from "./landingData";

export default function LandingPage() {
  return (
    <div className="w-full overflow-x-hidden font-montserrat">
      {/* Navigation */}
      <div className="w-full p-10 px-0 mx-0">
        <NavigationBar variant="landing" />
      </div>

      {/* Hero */}
      <HeroSection header={header} description={description} />

      {/* Goals */}
      <GoalsSection goals={goals} />

      {/* Categories */}
      <ProductCategories categories={productInformation} />

      {/* Features */}
      <FeatureShowcase features={features} />

      {/* FAQs */}
      <FAQSection faqs={faqslist} />

      {/* Footer */}
      <Footer className="w-full" />
    </div>
  );
}
