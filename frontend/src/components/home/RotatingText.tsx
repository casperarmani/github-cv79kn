import React, { useState, useEffect } from 'react';

const texts = [
  "Analyze video ads at scale. Get deep insight into winning ads to replicate them, and losing ads to see why they didn't perform.",
  "Consistently generate winning angles, copies, and offers using past performing ads. No more gut feeling and hours crafting new ad angles. Drop winning ads, and get variations that actually scale.",
  "No more days of competitor research. Simply drag and drop their ads & get mass competitor research in minutes, not days or weeks.",
  "Deep insight into trends, emotional flags, and nuances between videos that aren't easy to catch."
];

export function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
        setIsAnimating(false);
      }, 500);
    }, 7500); // 7000ms display + 500ms animation

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[60px] flex items-center justify-center my-12 py-4">
      <p
        className={`text-xl text-white/80 max-w-2xl mx-auto leading-relaxed text-center transition-all duration-500 ${
          isAnimating ? "opacity-0 transform -translate-y-2" : "opacity-100 transform translate-y-0"
        }`}
      >
        {texts[currentIndex]}
      </p>
    </div>
  );
}