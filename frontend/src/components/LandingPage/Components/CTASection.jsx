// CTASection.jsx
import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section className="py-20 px-6 bg-[#F9FAFB]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#1A2A44] mb-6">Ready to Transform Your Organization?</h2>
          <p className="text-xl text-[#2F3A4C] mb-8">
            Start with project management and HR today. Scale to a complete ERP tomorrow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/signup" className="px-8 py-4 bg-[#00C4B4] hover:bg-teal-600 text-white rounded-lg font-semibold shadow-lg transition">
              Start Free Trial - Get Your Subdomain
            </Link>
            <button className="px-8 py-4 border-2 border-[#1A2A44] text-[#1A2A44] hover:bg-[#1A2A44] hover:text-white rounded-lg font-semibold transition">
              Schedule a Demo
            </button>
          </div>

          <p className="text-sm text-[#B0B8C5]">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </div>
    </section>
  );
}