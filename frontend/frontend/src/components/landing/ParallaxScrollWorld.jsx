import React, { useEffect, useState } from "react";
import LandingNavbar from "./LandingNavbar";

// High Detail Layered Vector Artwork Imports (Scene 1 Hero)
import scene1Sky from "../../assets/artwork/scene1-sky.svg";
import scene1Mountains from "../../assets/artwork/scene1-mountains.svg";
import scene1Hills from "../../assets/artwork/scene1-hills.svg";
import scene1Foreground from "../../assets/artwork/scene1-foreground.svg";

export default function ParallaxScrollWorld({ onOpenLogin, onOpenRegister, isDark, toggleTheme }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Mouse move handler for gentle 3D mouse parallax
  useEffect(() => {
    if (reducedMotion) return;
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [reducedMotion]);

  // Layer transform calculation based on mouse position
  const getLayerTransform = (depthFactor) => {
    if (reducedMotion) return {};
    const mouseX = mousePos.x * 18 * depthFactor;
    const mouseY = mousePos.y * 18 * depthFactor;

    return {
      transform: `translate3d(${mouseX}px, ${mouseY}px, 0)`,
      willChange: "transform",
      transition: "transform 0.08s ease-out"
    };
  };

  const handleStart = () => {
    if (onOpenLogin) {
      onOpenLogin();
    } else if (onOpenRegister) {
      onOpenRegister();
    }
  };

  return (
    <div className="notosan-world-wrapper">
      {/* Top Floating Navbar */}
      <LandingNavbar
        onOpenLogin={handleStart}
        onOpenRegister={handleStart}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Fixed Fullscreen Viewport Canvas */}
      <div className="notosan-viewport-canvas" style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>
        {/* ================= SCENE 1: SUNSET MOUNTAIN HERO (Visite Style) ================= */}
        <div className="notosan-scene-fixed scene-active">
          <div className="scene-artwork-layer layer-sky" style={getLayerTransform(0.2)}>
            <img src={scene1Sky} alt="Sunset sky with flying cranes" className="layer-svg" />
          </div>
          <div className="scene-artwork-layer layer-far" style={getLayerTransform(0.5)}>
            <img src={scene1Mountains} alt="Sunset mountain peak" className="layer-svg" />
          </div>
          <div className="scene-artwork-layer layer-mid" style={getLayerTransform(0.8)}>
            <img src={scene1Hills} alt="Blue lake and water rocks" className="layer-svg" />
          </div>
          <div className="scene-artwork-layer layer-fore" style={getLayerTransform(1.4)}>
            <img src={scene1Foreground} alt="Traveler with Kasa hat and reeds" className="layer-svg" />
          </div>

          <div className="scene-content hero-content" style={{ pointerEvents: "auto" }}>
            <span className="scene-tag-notosan">
              <span className="kanji-symbol">山</span> Journey to new frontiers. Journey to GroupTrip Ledger
            </span>
            <h1 className="hero-title-massive">VISITE</h1>
            <p className="hero-description-notosan">
              Away from the manic energy of everyday life lies seamless trip ledger management.
              Surprising and captivating in equal measure, GroupTrip Ledger brings balance to shared expenses.
            </p>
            <div className="hero-cta-group">
              <button className="btn-pill-notosan" onClick={handleStart}>
                Start the journey ▸
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
