// Footer.jsx
import logo from '../../../assets/teamora/teamora_logo.png'
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1A2A44] text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <img src={logo} alt="Teamora Logo" className="w-8 h-8 object-contain rounded-full mr-3" />
            <span className="text-xl font-bold">Teamora</span>
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="hover:text-[#00C4B4] transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#00C4B4] transition">Terms of Service</Link>
            <Link to="/support" className="hover:text-[#00C4B4] transition">Support</Link>
          </div>
        </div>
        
        <div className="border-t border-[#2F3A4C] mt-8 pt-8 text-center text-sm opacity-75">
          © {new Date().getFullYear()} Teamora Inc. All rights reserved. • Building the future of business management, one organization at a time.
        </div>
      </div>
    </footer>
  );
}