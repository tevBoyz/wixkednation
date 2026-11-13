"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Full-width strip under the masthead. A box truck drives the width of the
 * screen, leaves the order on the step, and pulls away.
 */
export function DeliveryRunScene({ className }: { className?: string }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <figure
      className={cn(
        "delivery-run relative h-40 w-full overflow-hidden border-b border-white/10 bg-[#080b09] sm:h-52 md:h-64 lg:h-72 xl:h-80",
        reduceMotion && "delivery-run-still",
        className,
      )}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <rect width="1440" height="220" fill="#080b09" />
        <circle cx="120" cy="36" r="1.4" fill="#f4ffe9" opacity="0.7" />
        <circle cx="260" cy="22" r="1" fill="#f4ffe9" opacity="0.4" />
        <circle cx="480" cy="48" r="1.2" fill="#f4ffe9" opacity="0.55" />
        <circle cx="760" cy="28" r="1.1" fill="#f4ffe9" opacity="0.45" />
        <circle cx="1040" cy="40" r="1.3" fill="#f4ffe9" opacity="0.5" />
        <circle cx="1280" cy="24" r="1" fill="#f4ffe9" opacity="0.4" />
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-[var(--ground)] bg-[#121714]" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-px bg-white/15" />
        <div className="delivery-run-road absolute inset-x-0 top-[46%] h-0.5" />
      </div>

      <div className="delivery-run-house absolute bottom-[var(--ground)] z-10">
        <House />
        <svg
          className="delivery-run-drop absolute bottom-[15%] left-[58%] w-[16%]"
          viewBox="0 0 36 28"
          aria-hidden
        >
          <rect width="36" height="28" rx="3" fill="#f4ffe9" />
          <path d="M0 8 H36" stroke="#48801F" strokeWidth="2" />
          <path d="M18 0 V28" stroke="#48801F" strokeWidth="2" />
        </svg>
      </div>

      <div className="delivery-run-lane pointer-events-none absolute inset-y-0 left-0">
        <div className="delivery-run-van absolute bottom-[var(--ground)]">
          <Truck />
        </div>
      </div>

      <figcaption className="sr-only">
        A delivery truck drives across the screen, leaves an order on the
        doorstep, and continues down the road.
      </figcaption>
    </figure>
  );
}

function Truck() {
  return (
    <svg
      viewBox="0 0 460 168"
      className="block h-auto w-full overflow-visible"
      role="img"
      aria-label="Delivery truck"
    >
      <defs>
        <linearGradient id="delivery-run-headlight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e8ff9a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#c8ff3d" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="delivery-run-cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9ad85a" />
          <stop offset="55%" stopColor="#62a336" />
          <stop offset="100%" stopColor="#3f7a22" />
        </linearGradient>
        <linearGradient id="delivery-run-box" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5ea338" />
          <stop offset="100%" stopColor="#326818" />
        </linearGradient>
      </defs>

      <ellipse cx="214" cy="164" rx="156" ry="4" fill="#000" opacity="0.5" />

      <polygon
        className="delivery-run-beam"
        points="400,96 458,70 458,126"
        fill="url(#delivery-run-headlight)"
      />

      <rect x="18" y="34" width="252" height="104" rx="16" fill="url(#delivery-run-box)" />
      <rect x="18" y="34" width="252" height="20" rx="10" fill="#2c5818" />
      <rect x="32" y="40" width="108" height="4" rx="2" fill="#fff" opacity="0.2" />
      <rect x="22" y="112" width="8" height="14" rx="2" fill="#d6ff4a" />
      <rect x="36" y="64" width="54" height="38" rx="5" fill="#0e1410" />
      <rect x="39" y="67" width="48" height="10" fill="#f4ffe9" opacity="0.18" />
      <g className="delivery-run-cargo">
        <rect x="46" y="78" width="28" height="16" rx="2" fill="#f4ffe9" />
        <path d="M46 84 H74" stroke="#48801F" strokeWidth="1.6" />
        <path d="M60 78 V94" stroke="#48801F" strokeWidth="1.6" />
      </g>
      <clipPath id="delivery-run-logo-clip">
        <rect x="108" y="56" width="132" height="68" rx="8" />
      </clipPath>
      <g clipPath="url(#delivery-run-logo-clip)">
        <image
          href="/brand/wixkednation-mark-v3.png"
          x="104"
          y="34"
          width="140"
          height="112"
        />
      </g>
      <circle cx="46" cy="42" r="3" fill="#d6ff4a" />
      <circle cx="250" cy="42" r="3" fill="#d6ff4a" />

      <path
        d="M248 50 H352 C376 50 394 68 398 92 V132 H248 Z"
        fill="url(#delivery-run-cab)"
      />
      <path d="M264 58 H340 L354 90 H264 Z" fill="#e7f6dc" />
      <path d="M264 58 H300 L290 90 H264 Z" fill="#ffffff" opacity="0.55" />
      <rect x="304" y="98" width="38" height="20" rx="3" fill="#d7f5c4" />
      <path d="M296 94 V136" stroke="#3d7324" strokeWidth="2.5" />
      <rect x="282" y="112" width="12" height="3.5" rx="1.5" fill="#245016" />
      <rect x="236" y="60" width="12" height="22" rx="3" fill="#245016" />
      <rect x="382" y="98" width="16" height="11" rx="2.5" fill="#f7ffe8" />
      <circle cx="390" cy="103.5" r="2.4" fill="#d6ff4a" />
      <rect x="368" y="132" width="34" height="8" rx="2" fill="#1c241c" />

      <Wheel cx={92} cy={146} />
      <Wheel cx={328} cy={146} />
    </svg>
  );
}

function Wheel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g className="delivery-run-wheel">
      <circle cx={cx} cy={cy} r="22" fill="#2a312e" />
      <circle cx={cx} cy={cy} r="20.5" fill="none" stroke="#c5cdc6" strokeWidth="3" />
      <circle cx={cx} cy={cy} r="11" fill="#141816" stroke="#e4ece6" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="4.2" fill="#d6ff4a" />
      <path
        d={`M${cx} ${cy - 8} V${cy + 8} M${cx - 8} ${cy} H${cx + 8}`}
        stroke="#9aa39c"
        strokeWidth="1.6"
      />
    </g>
  );
}

function House() {
  return (
    <svg viewBox="0 0 320 220" className="block h-auto w-full overflow-visible" aria-hidden>
      <ellipse cx="176" cy="214" rx="108" ry="5" fill="#000" opacity="0.45" />
      <rect x="164" y="208" width="104" height="12" rx="2" fill="#1a221c" />
      <rect x="176" y="196" width="82" height="14" rx="2" fill="#24302a" />
      <rect x="186" y="186" width="62" height="12" rx="2" fill="#314038" />

      <rect x="48" y="96" width="224" height="100" fill="#1e2a24" />
      <rect x="48" y="96" width="9" height="100" fill="#314038" />
      <rect x="263" y="96" width="9" height="100" fill="#141c18" />
      <path
        d="M57 118 H263 M57 140 H263 M57 162 H263 M57 184 H263"
        stroke="#ffffff"
        strokeOpacity="0.08"
        strokeWidth="2"
      />

      <polygon points="28,104 160,38 292,104" fill="#101612" />
      <polygon points="22,100 160,28 298,100 286,92 160,34 34,92" fill="#2c3a32" />
      <path d="M34 92 L160 34 L286 92" fill="none" stroke="#5c6e62" strokeWidth="2.5" />

      <rect x="214" y="46" width="22" height="38" fill="#3d342c" />
      <rect x="210" y="42" width="30" height="8" rx="1" fill="#56483e" />
      <rect x="220" y="54" width="5" height="12" fill="#2a2420" opacity="0.55" />

      <rect x="70" y="116" width="66" height="52" rx="3" fill="#0c100e" />
      <rect className="delivery-run-porch" x="74" y="120" width="58" height="44" fill="#e7ff8a" />
      <path d="M103 116 V168 M70 142 H136" stroke="#1e2a24" strokeWidth="4" />

      <rect x="188" y="122" width="48" height="72" rx="2" fill="#121a16" />
      <rect x="194" y="128" width="36" height="30" rx="1" fill="#24342c" />
      <rect x="194" y="162" width="36" height="24" rx="1" fill="#1c2822" />
      <circle cx="224" cy="168" r="2.6" fill="#d6ff4a" />

      <rect x="164" y="110" width="8" height="12" rx="1" fill="#314038" />
      <path d="M162 122 H174" stroke="#314038" strokeWidth="2" />
      <circle className="delivery-run-porch" cx="168" cy="128" r="4" fill="#f4ffc4" />
    </svg>
  );
}
