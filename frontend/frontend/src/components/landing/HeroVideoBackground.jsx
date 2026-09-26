import React, { useEffect, useRef } from "react";

export default function HeroVideoBackground() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animFrameId = null;
    let timeoutId = null;

    const updateOpacity = () => {
      if (video) {
        const currentTime = video.currentTime;
        const duration = video.duration;

        if (!isNaN(duration) && duration > 0) {
          let opacity = 1;
          if (currentTime < 0.5) {
            opacity = currentTime / 0.5;
          } else if (duration - currentTime < 0.5) {
            opacity = (duration - currentTime) / 0.5;
          } else {
            opacity = 1;
          }
          opacity = Math.max(0, Math.min(1, opacity));
          video.style.opacity = opacity;
        }
      }
      animFrameId = requestAnimationFrame(updateOpacity);
    };

    animFrameId = requestAnimationFrame(updateOpacity);

    const handleEnded = () => {
      if (video) {
        video.style.opacity = 0;
        timeoutId = setTimeout(() => {
          video.currentTime = 0;
          video.play().catch(() => {});
        }, 100);
      }
    };

    video.addEventListener("ended", handleEnded);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (timeoutId) clearTimeout(timeoutId);
      if (video) video.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <div
      className="absolute z-0 pointer-events-none overflow-hidden"
      style={{ top: "300px", inset: "auto 0 0 0", bottom: 0 }}
    >
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="w-full h-full object-cover"
        style={{ opacity: 0 }}
      />
      <div className="absolute inset-0 aethera-hero-fade pointer-events-none" />
    </div>
  );
}
