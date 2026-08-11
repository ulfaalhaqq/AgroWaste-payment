"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Star, MapPin, LucideIcon } from "lucide-react";

export interface EarthyCardProps {
  href?: string;
  title: string;
  description?: string | null;
  badgeText?: string;
  badgeDotColorClass?: string; // e.g. "bg-land-accent" or "bg-sem-green"
  locationText?: string;
  rating?: number | string;
  imageUrl?: string | null;
  imageFallbackIcon?: LucideIcon;
  price?: string | number;
  unit?: string;
  ctaText?: string; // Text for bottom arrow CTA (e.g. "Lihat Detail")
  onCtaClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ctaLoading?: boolean;
  ctaSuccess?: boolean;
  ctaError?: boolean;
  ctaIcon?: LucideIcon;
  ctaSuccessIcon?: LucideIcon;
  ctaErrorIcon?: LucideIcon;
  decorativeIcon?: LucideIcon;
  className?: string;
  imageHeightClass?: string;
}

export default function EarthyCard({
  href,
  title,
  description,
  badgeText,
  badgeDotColorClass = "bg-land-accent",
  locationText,
  rating,
  imageUrl,
  imageFallbackIcon: FallbackIcon,
  price,
  unit,
  ctaText,
  onCtaClick,
  ctaLoading = false,
  ctaSuccess = false,
  ctaError = false,
  ctaIcon: CtaIcon,
  ctaSuccessIcon: CtaSuccessIcon,
  ctaErrorIcon: CtaErrorIcon,
  decorativeIcon: DecorativeIcon,
  className = "",
  imageHeightClass = "h-28 sm:h-44 md:h-56",
}: EarthyCardProps) {
  const wrapperClass = `w-full bg-land-bg rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-land-cream shadow-clay hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-clay-hover hover:border-land-accent/30 transition-all duration-300 flex flex-col group relative overflow-hidden cursor-pointer z-10 ${className}`;

  const inner = (
    <>
      {/* decorative background icon */}
      {DecorativeIcon && (
        <DecorativeIcon
          strokeWidth={1}
          className="absolute -bottom-4 -right-4 w-28 h-28 text-land-accent/8 pointer-events-none transition-transform duration-700 ease-out group-hover:rotate-12 group-hover:scale-105 z-0"
        />
      )}

      {/* Image container */}
      <div
        className={`w-full rounded-xl overflow-hidden relative mb-3 sm:mb-4 bg-land-warm flex items-center justify-center border border-land-cream/40 shrink-0 z-10 ${imageHeightClass}`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}

        {FallbackIcon && (
          <FallbackIcon className="w-10 h-10 sm:w-16 sm:h-16 text-land-secondary/20 relative z-10" />
        )}

        {/* badges overlay */}
        {badgeText && (
          <div className="absolute top-2 left-2 bg-land-bg/95 backdrop-blur-sm px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold text-land-ink border border-land-cream/30 shadow-sm flex items-center gap-1 z-20">
            <span
              className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${badgeDotColorClass} shrink-0`}
            />
            <span className="truncate max-w-[50px] sm:max-w-none">
              {badgeText}
            </span>
          </div>
        )}

        {rating && Number(rating) > 0 && (
          <div className="absolute top-2 right-2 bg-land-bg/95 backdrop-blur-sm px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold text-land-ink border border-land-cream/30 shadow-sm flex items-center gap-0.5 sm:gap-1 z-20">
            <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            <span className="font-tabular">{Number(rating).toFixed(1)}</span>
          </div>
        )}

        {locationText && (
          <div className="absolute bottom-2 left-2 max-w-[calc(100%-16px)] bg-land-bg/95 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[8.5px] sm:text-[10px] font-bold text-land-ink border border-land-cream/30 shadow-sm flex items-center gap-1 z-20">
            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-land-accent shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 relative z-10">
        <h3 className="font-land-heading text-sm sm:text-lg md:text-xl font-bold text-land-ink mb-1 sm:mb-2 line-clamp-2 leading-tight">
          {title}
        </h3>

        {description && (
          <p className="text-land-muted text-[11px] sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}

        {/* Bottom / Action area */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-land-cream/30 flex items-end justify-between">
          {price && (
            <div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-land-accent font-tabular leading-none mb-1">
                {price}
              </div>
              {unit && (
                <div className="text-[10px] sm:text-xs font-bold text-land-muted">
                  {unit}
                </div>
              )}
            </div>
          )}

          {/* secondary action */}
          {onCtaClick ? (
            <button
              onClick={onCtaClick}
              disabled={ctaLoading}
              className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed z-20 ${
                ctaSuccess
                  ? "bg-land-accent text-white"
                  : ctaError
                    ? "bg-red-100 text-red-600"
                    : "bg-land-warm text-land-ink hover:bg-land-accent hover:text-white"
              }`}
            >
              {ctaSuccess ? (
                CtaSuccessIcon ? (
                  <CtaSuccessIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <span>✓</span>
                )
              ) : ctaError ? (
                CtaErrorIcon ? (
                  <CtaErrorIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <span>✗</span>
                )
              ) : CtaIcon ? (
                <CtaIcon
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${ctaLoading ? "animate-pulse" : ""}`}
                />
              ) : (
                <span>+</span>
              )}
            </button>
          ) : null}
        </div>

        {/* arrow CTA */}
        {ctaText && (
          <div className="mt-3 flex items-center gap-1 text-xs sm:text-sm font-bold text-land-accent transition-colors group-hover:text-land-accent-hover">
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
          </div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={wrapperClass}>
        {inner}
      </Link>
    );
  }
  return <div className={wrapperClass}>{inner}</div>;
}
