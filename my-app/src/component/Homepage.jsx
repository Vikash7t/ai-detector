// src/pages/HomePage.jsx

import Navbar from "../component/navbar";
import HeroSection from "../component/HeroSection";
import FeaturesSection from "../component/FeaturesSection";
import HowItWorksSection from "../component/HowItWorksSection";
import PricingSection from './component/PricingSection';
import Footer from "../component/Footer";

function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection/>
      <Footer />
    </>
  );
}

export default HomePage;
