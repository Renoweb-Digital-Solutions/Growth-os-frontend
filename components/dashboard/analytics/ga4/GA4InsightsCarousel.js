"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GA4InsightCard from "./GA4InsightCard";

/**
 * GA4InsightsCarousel renders a horizontal card carousel with circular left/right navigation arrows.
 */
export default function GA4InsightsCarousel({ cards = [], selectedProperty, selectedPropertyObj }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtStart = el.scrollLeft <= 5;
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
    setCanScrollLeft(!isAtStart);
    setCanScrollRight(!isAtEnd);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollState();
    el.addEventListener("scroll", checkScrollState, { passive: true });
    window.addEventListener("resize", checkScrollState);

    return () => {
      el.removeEventListener("scroll", checkScrollState);
      window.removeEventListener("resize", checkScrollState);
    };
  }, [checkScrollState]);

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 350; // Approx 1 card width + gap
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group">
      {/* Left Navigation Arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label="Previous suggestions"
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 shadow-md hover:bg-slate-50 hover:scale-105 active:scale-95 flex items-center justify-center transition-all focus:outline-none"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label="Next suggestions"
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 shadow-md hover:bg-slate-50 hover:scale-105 active:scale-95 flex items-center justify-center transition-all focus:outline-none"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      )}

      {/* Horizontal Cards Scroll Container */}
      <div
        ref={scrollRef}
        className="flex flex-nowrap gap-4 overflow-x-auto scrollbar-none py-1 px-0.5 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {cards.map((card) => (
          <GA4InsightCard
            key={card.id}
            card={card}
            selectedProperty={selectedProperty}
            selectedPropertyObj={selectedPropertyObj}
          />
        ))}
      </div>
    </div>
  );
}
