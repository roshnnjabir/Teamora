import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSubdomain } from '../../utils/domainUtils'

// Component Imports
import Navigation from './Components/Navigation';
import HeroSection from './Components/HeroSection';
import FeaturesSection from './Components/FeaturesSection';
import RoadmapSection from './Components/RoadmapSection';
import SocialProofSection from './Components/SocialProofSection';
import EarlyAdopterSection from './Components/EarlyAdopterSection';
import CTASection from './Components/CTASection';
import Footer from './Components/Footer';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isSubdomain()) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <RoadmapSection />
      <SocialProofSection />
      <EarlyAdopterSection />
      <CTASection />
      <Footer />
    </div>
  );
}
