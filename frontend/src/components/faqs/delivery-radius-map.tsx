/**
 * FAQ delivery map:
 * - Real US silhouette background (from `/public/us-silhouette.svg`)
 * - Color-coded legend above the map for each delivery region
 * - Matching colored pins + rings on the map
 */

const REGIONS = [
  { label: "N. Virginia", color: "#148547", cx: 800, cy: 256 },
  { label: "Washington DC", color: "#0d6e8a", cx: 826, cy: 242 },
  { label: "S. Maryland", color: "#b45309", cx: 818, cy: 270 },
] as const;

export function DeliveryRadiusMap() {
  const hubX = 812;
  const hubY = 254;
  const radius = 60;
  const outerRadius = Math.round(radius * 1.4);

  return (
    <aside
      className="faq-delivery-map relative mx-auto w-full max-w-lg lg:sticky lg:top-28 lg:mx-0"
      aria-label="Delivery area map"
    >
      <div className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm backdrop-blur-sm sm:p-4">
        <p className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Delivery coverage
        </p>

        {/* Color-coded legend */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 px-1">
          {REGIONS.map((r) => (
            <span
              key={r.label}
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: r.color }}
            >
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: r.color }}
              />
              {r.label}
            </span>
          ))}
        </div>

        <div className="relative mt-3 aspect-[49/31] w-full overflow-hidden rounded-xl bg-[color-mix(in_srgb,#148547_8%,transparent)]">
          <svg
            className="h-full w-full"
            viewBox="0 0 980 620"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="United States map highlighting the GasNation delivery area"
          >
            <defs>
              <radialGradient
                id="faq-us-hub-glow"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform={`translate(${hubX} ${hubY}) scale(${radius * 2.4})`}
              >
                <stop offset="0%" stopColor="#148547" stopOpacity="0.42" />
                <stop offset="55%" stopColor="#148547" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#148547" stopOpacity="0" />
              </radialGradient>

              <filter
                id="faq-ring-shadow"
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="2.5"
                  floodColor="#148547"
                  floodOpacity="0.35"
                />
              </filter>
            </defs>

            {/* Real US silhouette background */}
            <image
              href="/us-silhouette.svg"
              x="0"
              y="0"
              width="980"
              height="620"
              preserveAspectRatio="none"
              opacity="0.12"
            />

            {/* Hub glow */}
            <circle cx={hubX} cy={hubY} r={radius * 2.1} fill="url(#faq-us-hub-glow)" />

            {/* Outer orbit ring */}
            <g
              className="faq-map-orbit-spin"
              style={{ transformOrigin: `${hubX}px ${hubY}px` }}
              filter="url(#faq-ring-shadow)"
            >
              <circle
                cx={hubX}
                cy={hubY}
                r={outerRadius}
                stroke="#148547"
                strokeOpacity="0.85"
                strokeWidth="3"
                strokeDasharray="10 12"
              />
              <circle
                cx={hubX}
                cy={hubY - outerRadius}
                r="5"
                fill="#148547"
                fillOpacity="0.95"
              />
            </g>

            {/* Inner pulse rings */}
            <circle
              className="faq-map-radius-pulse"
              cx={hubX}
              cy={hubY}
              r={radius}
              stroke="#148547"
              strokeOpacity="0.7"
              strokeWidth="2.2"
              filter="url(#faq-ring-shadow)"
              style={{ transformOrigin: `${hubX}px ${hubY}px` }}
            />
            <circle
              className="faq-map-radius-pulse-delay"
              cx={hubX}
              cy={hubY}
              r={radius}
              stroke="#148547"
              strokeOpacity="0.5"
              strokeWidth="1.6"
              filter="url(#faq-ring-shadow)"
              style={{ transformOrigin: `${hubX}px ${hubY}px` }}
            />

            {/* Color-coded region outlines (replace dots with boundaries) */}
            {REGIONS.map((r, i) => {
              // Approximate "area" shapes around each region point.
              const outlineR = i === 0 ? 44 : i === 1 ? 38 : 42;
              const innerR = Math.max(14, Math.round(outlineR - 12));

              return (
                <g key={r.label}>
                  {/* subtle fill to make the outline read better */}
                  <circle cx={r.cx} cy={r.cy} r={outlineR} fill={r.color} fillOpacity="0.08" />
                  {/* main outline */}
                  <circle
                    cx={r.cx}
                    cy={r.cy}
                    r={outlineR}
                    fill="none"
                    stroke={r.color}
                    strokeOpacity="0.95"
                    strokeWidth="3"
                    strokeDasharray="10 8"
                  />
                  {/* inner accent outline */}
                  <circle
                    cx={r.cx}
                    cy={r.cy}
                    r={innerR}
                    fill="none"
                    stroke={r.color}
                    strokeOpacity="0.55"
                    strokeWidth="1.8"
                    strokeDasharray="3 6"
                  />
                </g>
              );
            })}

            {/* On-map labels next to pins */}
            {REGIONS.map((r, i) => {
              const labelX = r.cx - 100;
              const labelY = r.cy + (i === 0 ? -18 : i === 1 ? 0 : 20);
              return (
                <g key={`label-${r.label}`}>
                  <rect
                    x={labelX - 4}
                    y={labelY - 12}
                    width={90}
                    height={18}
                    rx={9}
                    fill="#ffffff"
                    fillOpacity="0.85"
                  />
                  <text
                    x={labelX + 1}
                    y={labelY}
                    fill={r.color}
                    fontSize="11"
                    fontFamily="system-ui, sans-serif"
                    fontWeight="700"
                  >
                    {r.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <p className="mt-3 px-1 text-xs leading-relaxed text-muted-foreground">
          We deliver across Northern Virginia, Washington DC, and South
          Maryland. If your city is nearby, reach out - we probably cover it.
        </p>
      </div>
    </aside>
  );
}
