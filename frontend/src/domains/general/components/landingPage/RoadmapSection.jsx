// RoadmapSection.jsx

export default function RoadmapSection() {
  return (
    <section className="py-16 px-6 bg-[#E5E8EC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A2A44] mb-4">What's Coming Next</h2>
            <p className="text-lg text-[#2F3A4C]">Your platform grows with your business needs</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#B0B8C5]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">💰</span>
                <span className="bg-[#FBBF24] text-white px-2 py-1 rounded text-xs font-medium">Q3 2025</span>
              </div>
              <h4 className="font-bold text-[#1A2A44] mb-2">Finance & Accounting</h4>
              <p className="text-sm text-[#2F3A4C]">Complete financial management and reporting</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#B0B8C5]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">📦</span>
                <span className="bg-[#50C6E9] text-white px-2 py-1 rounded text-xs font-medium">Q4 2025</span>
              </div>
              <h4 className="font-bold text-[#1A2A44] mb-2">Inventory Management</h4>
              <p className="text-sm text-[#2F3A4C]">Stock control and supply chain optimization</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#B0B8C5]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">🤝</span>
                <span className="bg-[#34D399] text-white px-2 py-1 rounded text-xs font-medium">Q1 2026</span>
              </div>
              <h4 className="font-bold text-[#1A2A44] mb-2">CRM & Sales</h4>
              <p className="text-sm text-[#2F3A4C]">Customer relationship and sales pipeline management</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#B0B8C5]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">📊</span>
                <span className="bg-[#FF6F61] text-white px-2 py-1 rounded text-xs font-medium">Q2 2026</span>
              </div>
              <h4 className="font-bold text-[#1A2A44] mb-2">Advanced Analytics</h4>
              <p className="text-sm text-[#2F3A4C]">Business intelligence and predictive insights</p>
            </div>
          </div>
        </div>
    </section>
  );
}