"use client"

/**
 * Grid Overlay — Sutéra-inspired technical grid background
 *
 * A fixed SVG grid with:
 * - Vertical + horizontal lines in gold/white at very low opacity
 * - Crosshair markers at intersections
 * - Sits behind all content as atmospheric texture
 *
 * Color-matched to Co-Lab AI's dark theme with gold accents.
 */

export function GridOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none w-full h-full overflow-hidden" style={{ zIndex: 0 }}>
      {/* Desktop grid (3 vertical, 2 horizontal) */}
      <svg
        className="hidden lg:block w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1728 958"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="1728" height="958" fill="none" />
        {/* Vertical lines */}
        <line x1="432" x2="432" y2="958" stroke="rgba(212,175,55,0.10)" strokeWidth="0.5" />
        <line x1="864" x2="864" y2="958" stroke="rgba(212,175,55,0.10)" strokeWidth="0.5" />
        <line x1="1296" x2="1296" y2="958" stroke="rgba(212,175,55,0.10)" strokeWidth="0.5" />
        {/* Horizontal lines */}
        <line y1="319" x2="1728" y2="319" stroke="rgba(212,175,55,0.10)" strokeWidth="0.5" />
        <line y1="638" x2="1728" y2="638" stroke="rgba(212,175,55,0.10)" strokeWidth="0.5" />

        {/* Crosshair markers at intersections */}
        {[
          [432, 319], [864, 319], [1296, 319],
          [432, 638], [864, 638], [1296, 638],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <rect x={cx - 10} y={cy - 10} width="21" height="21" fill="rgba(0,0,0,0.8)" stroke="none" />
            <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} stroke="rgba(212,175,55,0.18)" strokeWidth="0.5" />
            <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke="rgba(212,175,55,0.18)" strokeWidth="0.5" />
          </g>
        ))}
      </svg>

      {/* Tablet grid (2 vertical, 3 horizontal) */}
      <svg
        className="hidden md:block lg:hidden w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 834 1194"
        preserveAspectRatio="xMidYMid slice"
      >
        <line x1="278" x2="278" y2="1194" stroke="rgba(212,175,55,0.09)" strokeWidth="0.5" />
        <line x1="556" x2="556" y2="1194" stroke="rgba(212,175,55,0.09)" strokeWidth="0.5" />
        <line y1="298" x2="834" y2="298" stroke="rgba(212,175,55,0.09)" strokeWidth="0.5" />
        <line y1="596" x2="834" y2="596" stroke="rgba(212,175,55,0.09)" strokeWidth="0.5" />
        <line y1="894" x2="834" y2="894" stroke="rgba(212,175,55,0.09)" strokeWidth="0.5" />
        {[
          [278, 298], [556, 298],
          [278, 596], [556, 596],
          [278, 894], [556, 894],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <rect x={cx - 8} y={cy - 8} width="17" height="17" fill="rgba(0,0,0,0.8)" stroke="none" />
            <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 4} stroke="rgba(212,175,55,0.15)" strokeWidth="0.5" />
            <line x1={cx - 4} y1={cy} x2={cx + 4} y2={cy} stroke="rgba(212,175,55,0.15)" strokeWidth="0.5" />
          </g>
        ))}
      </svg>

      {/* Mobile grid (2 vertical, 3 horizontal) */}
      <svg
        className="md:hidden w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 393 852"
        preserveAspectRatio="xMidYMid slice"
      >
        <line x1="131" x2="131" y2="852" stroke="rgba(212,175,55,0.08)" strokeWidth="0.5" />
        <line x1="262" x2="262" y2="852" stroke="rgba(212,175,55,0.08)" strokeWidth="0.5" />
        <line y1="213" x2="393" y2="213" stroke="rgba(212,175,55,0.08)" strokeWidth="0.5" />
        <line y1="426" x2="393" y2="426" stroke="rgba(212,175,55,0.08)" strokeWidth="0.5" />
        <line y1="639" x2="393" y2="639" stroke="rgba(212,175,55,0.08)" strokeWidth="0.5" />
        {[
          [131, 213], [262, 213],
          [131, 426], [262, 426],
          [131, 639], [262, 639],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <rect x={cx - 7} y={cy - 7} width="14" height="14" fill="rgba(0,0,0,0.8)" stroke="none" />
            <line x1={cx} y1={cy - 3} x2={cx} y2={cy + 3} stroke="rgba(212,175,55,0.13)" strokeWidth="0.5" />
            <line x1={cx - 3} y1={cy} x2={cx + 3} y2={cy} stroke="rgba(212,175,55,0.13)" strokeWidth="0.5" />
          </g>
        ))}
      </svg>
    </div>
  )
}
