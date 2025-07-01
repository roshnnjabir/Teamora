// SocialProofSection.jsx
import { useEffect, useState } from 'react';

const testimonials = [
  {
    quote:
      "Teamora transformed how we manage projects and our team. Having our own subdomain makes it feel truly ours, and knowing it's evolving into a full ERP gives us confidence in our investment.",
    name: 'Arun C Mohan',
    role: 'Chief Technology Officer, Brototype',
    initials: 'BR',
  },
  {
    quote:
      "Teamora’s streamlined interface and extensibility align with how we build software at Zerodha. simple, fast, and reliable. It’s refreshing to see a product that respects developer time while scaling for larger teams.",
    name: 'Kailash Nadh',
    role: 'Chief Technology Officer, Zerodha',
    initials: 'KN',
  },
  {
    quote:
      "At KPH.CLUB, we connect the top 1% of talent and startup founders building incredible products. Teamora fits right into our workflow fast, focused, and founder-friendly. It's a tool we’re proud to recommend to our community.",
    name: 'Felix Josemon',
    role: 'Founder, KPH.CLUB',
    initials: 'FJ',
  },
];

export default function SocialProofSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 3000); // change every 6 seconds
    return () => clearInterval(interval);
  }, []);

  const testimonial = testimonials[current];

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

        {/* Testimonial Card with fade animation */}
        <div
          key={testimonial.name}
          className="transition-opacity duration-700 ease-in-out bg-[#F9FAFB] p-8 rounded-xl border border-[#E5E8EC]"
        >
          <blockquote className="text-lg text-[#2F3A4C] mb-4">
            "{testimonial.quote}"
          </blockquote>
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-[#00C4B4] rounded-full flex items-center justify-center text-white font-bold mr-3">
              {testimonial.initials}
            </div>
            <div className="text-left">
              <div className="font-medium text-[#1A2A44]">{testimonial.name}</div>
              <div className="text-sm text-[#B0B8C5]">{testimonial.role}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}