import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSubdomain } from '../../../utils/domainUtils'

// Component Imports
import Navigation from '../components/landingPage/Navigation';
import HeroSection from '../components/landingPage/HeroSection';
import FeaturesSection from '../components/landingPage/FeaturesSection';
import RoadmapSection from '../components/landingPage/RoadmapSection';
import SocialProofSection from '../components/landingPage/SocialProofSection';
import EarlyAdopterSection from '../components/landingPage/EarlyAdopterSection';
import CTASection from '../components/landingPage/CTASection';
import Footer from '../components/landingPage/Footer';

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
