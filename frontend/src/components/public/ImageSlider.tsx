"use client";

import React, { useState, useEffect } from "react";

interface ImageSliderProps {
  images: string[];
  overlayClass?: string;
  interval?: number;
}

export default function ImageSlider({
  images,
  overlayClass = "",
  interval = 4500,
}: ImageSliderProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="aspect-[4/5] rounded-[24px] overflow-hidden shadow-2xl relative w-full h-full bg-[#E8E0D5]/40 select-none">
      {images.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <img
            src={src}
            alt="Pertanian Sirkular AgroWaste"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
      {/* Earthy warm/ink overlay tint */}
      <div
        className={`absolute inset-0 mix-blend-multiply z-20 pointer-events-none ${overlayClass}`}
      />
    </div>
  );
}
