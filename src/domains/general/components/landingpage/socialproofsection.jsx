import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

const testimonials = [
  {
    quote:
      "Teamora transformed how we manage projects and our team. Having our own subdomain makes it feel truly ours, and knowing it's evolving into a full ERP gives us confidence in our investment.",
    name: 'Arun C Mohan',
    role: 'Chief Technology Officer, Brototype',
    initials: 'BR',
    company: 'Brototype',
  },
  {
    quote:
      "Teamora's streamlined interface and extensibility align with how we build software at Zerodha. Simple, fast, and reliable. It's refreshing to see a product that respects developer time while scaling for larger teams.",
    name: 'Kailash Nadh',
    role: 'Chief Technology Officer, Zerodha',
    initials: 'KN',
    company: 'Zerodha',
  },
  {
    quote:
      "At KPH, we connect the top 1% of talent and startup founders building incredible products. Teamora fits right into our workflow fast, focused, and founder-friendly. It's a tool we're proud to recommend to our community.",
    name: 'Felix Josemon',
    role: 'Founder, KPH',
    initials: 'FJ',
    company: 'KPH',
  },
];

const stats = [
  { value: '2,500+', label: 'Active Organizations', icon: '🏢' },
  { value: '50,000+', label: 'Projects Managed', icon: '📊' },
  { value: '99.9%', label: 'Uptime Guarantee', icon: '⚡' },
];

export default function SocialProofSection() {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  const goToSlide = useCallback((index) => {
    setCurrent(index);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, nextSlide]);

  const testimonial = testimonials[current];

  return (
    <section className="py-20 px-6 bg-[#F9FAFB] relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#00C4B4] rounded-full blur-3xl opacity-5"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#FF6F61] rounded-full blur-3xl opacity-5"></div>
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#00C4B4]/10 text-[#00C4B4] px-4 py-2 rounded-full text-sm font-medium mb-4 border border-[#00C4B4]/20">
            <span className="w-2 h-2 bg-[#00C4B4] rounded-full"></span>
            Trusted by Industry Leaders
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A2A44] mb-4">
            Join 2,500+ Growing Organizations
          </h2>
          <p className="text-lg text-[#2F3A4C] max-w-2xl mx-auto">
            See why leading companies trust Teamora to transform their project management
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white p-8 rounded-2xl border border-[#E5E8EC] shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="text-4xl font-bold text-[#00C4B4] mb-2">
                {stat.value}
              </div>
              <div className="text-[#2F3A4C] font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonial Section */}
        <div className="relative">
          {/* Controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#E5E8EC] shadow-sm hover:shadow-md transition-shadow duration-200 text-[#2F3A4C] hover:text-[#1A2A44]"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {isPlaying ? 'Pause' : 'Play'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-10 h-10 bg-white rounded-full border border-[#E5E8EC] shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center text-[#2F3A4C] hover:text-[#1A2A44]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="w-10 h-10 bg-white rounded-full border border-[#E5E8EC] shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center text-[#2F3A4C] hover:text-[#1A2A44]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="relative overflow-hidden">
            <div
              className="flex transition-all duration-500 ease-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={testimonial.name} className="w-full flex-shrink-0 px-2">
                  <div className="bg-white p-10 rounded-3xl border border-[#E5E8EC] shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
                    {/* Quote marks */}
                    <div className="absolute top-6 left-8 text-6xl text-[#00C4B4]/15 font-serif">"</div>
                    
                    <div className="relative z-10">
                      <blockquote className="text-xl leading-relaxed text-[#2F3A4C] mb-8 pl-8">
                        {testimonial.quote}
                      </blockquote>
                      
                      <div className="flex items-center pl-8">
                        <div className="w-16 h-16 bg-[#00C4B4] rounded-2xl flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
                          {testimonial.initials}
                        </div>
                        <div>
                          <div className="font-bold text-[#1A2A44] text-lg">{testimonial.name}</div>
                          <div className="text-[#B0B8C5] text-sm mb-1">{testimonial.role}</div>
                          <div className="text-[#00C4B4] text-sm font-medium">{testimonial.company}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 gap-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all duration-200 ${
                  current === index
                    ? 'bg-[#00C4B4] w-8'
                    : 'bg-[#B0B8C5] w-3 hover:bg-[#00C4B4]/50'
                }`}
              />
            ))}
          </div>

          {/* Simple progress indicator */}
          {isPlaying && (
            <div className="mt-6 mx-auto max-w-md">
              <div className="h-1 bg-[#E5E8EC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00C4B4] rounded-full"
                  style={{
                    animation: 'progress 5s linear infinite'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E8EC] shadow-lg">
            <div className="text-[#2F3A4C]">
              <span className="font-medium">Ready to join them?</span>
            </div>
            <a href="/signup">
              <button className="bg-[#00C4B4] hover:bg-[#1A2A44] text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 shadow-lg">
                Start Free Trial
              </button>
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </section>
  );
}