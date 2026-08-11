import React from "react";

export function Marquee() {
  const items = Array(12).fill("Green The Planet");

  return (
    <div className="relative w-full overflow-hidden bg-[#E2EBD4] py-3 border-y border-[#C9D7BA]/40 flex items-center select-none">
      <div
        className="flex gap-16 animate-marquee whitespace-nowrap min-w-full shrink-0"
        style={{ "--duration": "35s", "--gap": "4rem" } as React.CSSProperties}
      >
        {items.map((text, i) => (
          <div
            key={i}
            className="flex items-center gap-16 text-[#1C3A27] font-bold tracking-[0.15em] uppercase text-xs md:text-sm"
          >
            <span>{text}</span>
            <img
              src="/LOGO.png"
              alt=""
              className="w-5 h-5 md:w-6 md:h-6 object-contain"
            />
          </div>
        ))}
      </div>
      <div
        className="flex gap-16 animate-marquee whitespace-nowrap min-w-full shrink-0"
        aria-hidden="true"
        style={{ "--duration": "35s", "--gap": "4rem" } as React.CSSProperties}
      >
        {items.map((text, i) => (
          <div
            key={i}
            className="flex items-center gap-16 text-[#1C3A27] font-bold tracking-[0.15em] uppercase text-xs md:text-sm"
          >
            <span>{text}</span>
            <img
              src="/LOGO.png"
              alt=""
              className="w-5 h-5 md:w-6 md:h-6 object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
