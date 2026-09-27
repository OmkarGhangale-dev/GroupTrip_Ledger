import React, { useState } from "react";
import HeroVideoBackground from "./HeroVideoBackground";

export default function AetheraHero({
  onOpenLogin,
  onOpenRegister,
  isDark,
  toggleTheme,
}) {
  const [selectedInfo, setSelectedInfo] = useState(null);

  const handleStart = () => {
    if (onOpenLogin) {
      onOpenLogin();
    } else if (onOpenRegister) {
      onOpenRegister();
    }
  };

  const infoDetails = {
    Studio: {
      title: "FareShare Design Studio",
      subtitle: "Crafting Next-Gen Financial Tools for Modern Travelers",
      description:
        "FareShare Studio combines minimalist design aesthetic with robust financial engineering. We specialize in zero-math debt simplification algorithms, real-time group ledgers, and intelligent optical receipt parsing for seamless trip management.",
      highlights: [
        "Minimalist & intuitive user experience",
        "Automated zero-hop settlement calculations",
        "Multi-currency & real-time offline sync",
      ],
    },
    About: {
      title: "About FareShare",
      subtitle: "Fair, Transparent & Frictionless Group Travel",
      description:
        "FareShare was created to eliminate the awkwardness of splitting expenses during group expeditions. Whether it's accommodation, scooter rentals, beach shack dinners, or activity passes — FareShare handles splits with precision.",
      highlights: [
        "Live group expense tracking",
        "Individual balances & customized statements",
        "Built-in AI travel chatbot & smart itinerary builder",
      ],
    },
    Journal: {
      title: "FareShare Journal",
      subtitle: "Insights & Technical Innovations",
      description:
        "Read about our latest algorithmic breakthroughs: how natural language parsing turns 'Dinner 2400 paid by Priya split with everyone' into precise ledger splits, and how our graph algorithms optimize balance transfers.",
      highlights: [
        "Natural Language Expense Parsing (Beta)",
        "OCR Receipt Scanner with high-confidence item extraction",
        "Interactive Trip Mapping & Itinerary Sync",
      ],
    },
    "Reach Us": {
      title: "Reach Us",
      subtitle: "Get in Touch with the FareShare Team",
      description:
        "Have questions, feedback, or custom trip integration ideas? Our team is always here to support your group journeys.",
      highlights: [
        "Email: support@fareshare.app",
        "Community Discord & Feedback Forum",
        "24/7 AI Travel Assistant inside the app",
      ],
    },
  };

  return (
    <div className="aethera-hero relative min-h-screen w-full overflow-hidden">
      <HeroVideoBackground />

      {/* HEADER / NAVIGATION */}
      <header className="relative z-10 w-full">
        <nav className="flex justify-between items-center px-6 sm:px-10 lg:px-12 py-6 w-full">
          {/* Logo */}
          <span
            className="font-instrument text-3xl tracking-tight select-none cursor-pointer"
            style={{ color: "#000000" }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            FareShare<sup>®</sup>
          </span>

          {/* Menu Items (hidden below md breakpoint) */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-sm font-medium transition-colors hover:text-black"
              style={{ color: "#000000" }}
            >
              Home
            </a>

          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">


            {/* Begin Journey Header CTA */}
            <button
              className="rounded-full px-6 py-2.5 text-sm font-medium transition-transform hover:scale-[1.03] cursor-pointer"
              style={{ background: "#000000", color: "#FFFFFF" }}
              onClick={handleStart}
            >
              Begin Journey
            </button>
          </div>
        </nav>
      </header>

      {/* HERO CONTENT SECTION */}
      <section
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 pb-40"
        style={{ paddingTop: "calc(8rem - 75px)" }}
      >
        <h1
          className="animate-fade-rise font-instrument font-normal text-5xl sm:text-7xl md:text-8xl max-w-7xl"
          style={{ lineHeight: 0.95, letterSpacing: "-2.46px" }}
        >
          Beyond <em>journeys,</em> we build <em> clarity </em>
        </h1>
        <p
          className="animate-fade-rise-delay text-base sm:text-lg max-w-2xl mt-8 leading-relaxed font-inter"
          style={{ color: "#6F6F6F" }}
        >
          Multi-Vendor Group Travel Coordination & Settlement
        </p>
        <button
          className="animate-fade-rise-delay-2 rounded-full px-14 py-5 text-base font-medium mt-12 transition-transform hover:scale-[1.03] cursor-pointer"
          style={{ background: "#000000", color: "#FFFFFF" }}
          onClick={handleStart}
        >
          Begin Journey
        </button>

        {/* Feature Highlights Quick Strip */}
        <div className="animate-fade-rise-delay-2 mt-14 flex flex-wrap justify-center gap-4 max-w-4xl">
          {[
            { title: "Smart Natural Language Splits", tag: "AI Beta" },
            { title: "Zero-Math Debt Optimization", tag: "Algorithm" },
            { title: "Optical Receipt Scanner", tag: "OCR" },
            { title: "Interactive Expedition Map", tag: "GPS" },
          ].map((feat, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedInfo("Studio")}
              className="px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-md border border-black/10 shadow-sm flex items-center gap-2.5 cursor-pointer hover:bg-black/5 hover:scale-105 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-black"></span>
              <span className="text-xs font-medium text-black">{feat.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/10 text-black/70 font-semibold">{feat.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE SECTION INFO MODAL */}
      {selectedInfo && infoDetails[selectedInfo] && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-rise"
          onClick={() => setSelectedInfo(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-black/10 text-black relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedInfo(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-black/60 hover:text-black hover:bg-black/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
              <span className="text-xs font-semibold uppercase tracking-widest text-black/50">
                FareShare Explore Section
              </span>
            </div>
            <h3 className="font-instrument text-4xl mb-1">
              {infoDetails[selectedInfo].title}
            </h3>
            <p className="text-sm font-medium text-black/70 mb-4">
              {infoDetails[selectedInfo].subtitle}
            </p>
            <p className="text-sm font-inter leading-relaxed text-black/80 mb-6">
              {infoDetails[selectedInfo].description}
            </p>
            <div className="bg-black/5 rounded-2xl p-4 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-black/60 mb-2">
                Key Highlights
              </h4>
              <ul className="space-y-2">
                {infoDetails[selectedInfo].highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-inter text-black/90">
                    <span className="text-black font-bold">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedInfo(null)}
                className="px-5 py-2.5 rounded-full border border-black/20 text-xs font-medium hover:bg-black/5 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedInfo(null);
                  handleStart();
                }}
                className="px-6 py-2.5 rounded-full bg-black text-white text-xs font-medium hover:scale-105 transition-transform cursor-pointer"
              >
                Begin Journey &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
