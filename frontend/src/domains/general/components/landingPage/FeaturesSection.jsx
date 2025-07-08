// FeaturesSection.jsx

export default function FeaturesSection() {
  return (
    <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A2A44] mb-4">Ready to Use Today</h2>
            <p className="text-lg text-[#2F3A4C]">Powerful features available right now for your organization</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#F9FAFB] p-8 rounded-xl border border-[#E5E8EC] hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#00C4B4] rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">PM</span>
              </div>
              <h3 className="text-xl font-bold text-[#1A2A44] mb-3">Project Management Hub</h3>
              <p className="text-[#2F3A4C]">Complete project lifecycle management with tasks, deadlines, team collaboration, and progress tracking.</p>
            </div>

            <div className="bg-[#F9FAFB] p-8 rounded-xl border border-[#E5E8EC] hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#FF6F61] rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">HR</span>
              </div>
              <h3 className="text-xl font-bold text-[#1A2A44] mb-3">HR & People Management</h3>
              <p className="text-[#2F3A4C]">Employee onboarding, attendance tracking, leave management, and team organizational tools.</p>
            </div>

            <div className="bg-[#F9FAFB] p-8 rounded-xl border border-[#E5E8EC] hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#50C6E9] rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">MT</span>
              </div>
              <h3 className="text-xl font-bold text-[#1A2A44] mb-3">Multi-Tenant Architecture</h3>
              <p className="text-[#2F3A4C]">Secure, isolated workspaces with custom subdomains. Perfect for organizations of all sizes.</p>
            </div>
          </div>
        </div>
    </section>
  );
}