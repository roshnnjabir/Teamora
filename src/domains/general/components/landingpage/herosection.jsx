// HeroSection.jsx
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center bg-[#E5E8EC] rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-[#34D399] rounded-full mr-2"></span>
            <span className="text-sm font-medium text-[#2F3A4C]">Multi-Tenant SaaS • Your Own Subdomain</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#1A2A44] mb-6 leading-tight">
            Your Business Management Platform 
            <span className="text-[#00C4B4]"> Starts Here</span>
          </h1>
          
          <p className="text-xl text-[#2F3A4C] mb-8 max-w-3xl mx-auto leading-relaxed">
            Begin with powerful project management and HR tools. Scale to a complete ERP system as your organization grows. 
            <span className="text-[#FF6F61] font-medium"> Each tenant gets their own secure subdomain.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup" className="px-8 py-4 bg-[#00C4B4] hover:bg-teal-600 text-white rounded-lg font-semibold shadow-lg transition transform hover:scale-105">
              Start Your Organization
            </Link>
            <Link to="/" className="px-8 py-4 border-2 border-[#1A2A44] text-[#1A2A44] hover:bg-[#1A2A44] hover:text-white rounded-lg font-semibold transition">
              Access Your Workspace
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#B0B8C5]">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-[#34D399] rounded-full mr-2"></span>
              Free 30-day trial
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-[#34D399] rounded-full mr-2"></span>
              No credit card required
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-[#34D399] rounded-full mr-2"></span>
              Custom subdomain included
            </span>
          </div>
        </div>
    </section>
  );
}
