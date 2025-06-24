import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSubdomain } from '../../utils/domainUtils'

// Component Imports
import Navigation from '../../components/LandingPage/Navigation';
import HeroSection from '../../components/LandingPage/HeroSection';
import FeaturesSection from '../../components/LandingPage/FeaturesSection';
import RoadmapSection from '../../components/LandingPage/RoadmapSection';
import SocialProofSection from '../../components/LandingPage/SocialProofSection';
import EarlyAdopterSection from '../../components/LandingPage/EarlyAdopterSection';
import CTASection from '../../components/LandingPage/CTASection';
import Footer from '../../components/LandingPage/Footer';

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
