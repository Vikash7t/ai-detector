
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import  'bootstrap/dist/js/bootstrap.bundle.min.js';
import Navbar from './component/navbar';
import HeroSection from './component/HeroSection';
import FeaturesSection from './component/FeatureSection';
import HowItWorksSection from './component/HowItWorkSection';
import PricingSection from './component/PricingSection.jsx';
import Footer from './component/Footer';
import 'animate.css';



function App() {
  return (
  <div className='container mt-5 pt-5'>
<Navbar/>
<HeroSection/>
<FeaturesSection/>
<HowItWorksSection/>
<PricingSection/>
<Footer/>
    </div>
  );
}


export default App;
