// EarlyAdopterSection.jsx
import { Link } from "react-router-dom";

export default function EarlyAdopterSection() {
  return (
    <section className="py-16 px-6 bg-gradient-to-r from-[#1A2A44] to-[#2F3A4C]">
      <div className="max-w-4xl mx-auto text-center text-white">
        <h2 className="text-3xl font-bold mb-6">Early Adopter Advantages</h2>
        <p className="text-xl mb-8 opacity-90">Get more value as we grow together</p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur">
            <h4 className="font-bold mb-2">🔒 Locked-in Pricing</h4>
            <p className="opacity-90">Your current pricing stays the same as we add new modules</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur">
            <h4 className="font-bold mb-2">🎯 Shape Development</h4>
            <p className="opacity-90">Direct input on features and priority development requests</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur">
            <h4 className="font-bold mb-2">⚡ Priority Access</h4>
            <p className="opacity-90">First access to new modules and beta features</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur">
            <h4 className="font-bold mb-2">🤝 Dedicated Support</h4>
            <p className="opacity-90">Personal onboarding and priority customer success</p>
          </div>
        </div>
        
        <Link to="/signup" className="inline-block px-8 py-4 bg-[#00C4B4] hover:bg-teal-600 text-white rounded-lg font-semibold shadow-lg transition transform hover:scale-105">
          Claim Your Early Adopter Benefits
        </Link>
      </div>
    </section>
  );
}