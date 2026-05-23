"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar flex aspect-square w-full snap-x snap-mandatory overflow-x-auto bg-muted"
      >
        {images.map((src, i) => (
          <div key={i} className="relative aspect-square w-full shrink-0 snap-center">
            <Image
              src={src}
              alt={`${alt} — ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 448px"
              className="object-contain p-6"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      {/* Dots */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-4 bg-foreground" : "w-1.5 bg-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
