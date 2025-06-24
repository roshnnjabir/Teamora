// SocialProofSection.jsx

export default function SocialProofSection() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-[#1A2A44] mb-8">Join 2,500+ Growing Organizations</h2>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="p-6">
            <div className="text-3xl font-bold text-[#00C4B4] mb-2">2,500+</div>
            <div className="text-[#2F3A4C]">Active Organizations</div>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-[#00C4B4] mb-2">50,000+</div>
            <div className="text-[#2F3A4C]">Projects Managed</div>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-[#00C4B4] mb-2">99.9%</div>
            <div className="text-[#2F3A4C]">Uptime Guarantee</div>
          </div>
        </div>
        
        <div className="bg-[#F9FAFB] p-8 rounded-xl border border-[#E5E8EC]">
          <blockquote className="text-lg text-[#2F3A4C] mb-4">
            "Teamora transformed how we manage projects and our team. Having our own subdomain makes it feel truly ours, and knowing it's evolving into a full ERP gives us confidence in our investment."
          </blockquote>
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-[#00C4B4] rounded-full flex items-center justify-center text-white font-bold mr-3">
              S
            </div>
            <div className="text-left">
              <div className="font-medium text-[#1A2A44]">Sarah Chen</div>
              <div className="text-sm text-[#B0B8C5]">Operations Director, TechFlow Solutions</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}