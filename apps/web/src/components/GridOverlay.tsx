"use client"

/**
 * Grid Overlay — technical grid background
 *
 * Uses percentage-based SVG lines so the grid scales correctly
 * at any viewport size. No hardcoded viewBox dimensions.
 *
 * - 3 vertical lines (25% / 50% / 75%)
 * - 2 horizontal lines (33% / 66%)
 * - Small crosshair marks at intersections
 */

const GOLD = "rgba(212,175,55,"

const VERTICALS = ["25%", "50%", "75%"]
const HORIZONTALS = ["33.33%", "66.66%"]

export function GridOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Vertical lines */}
        {VERTICALS.map((x) => (
          <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100%" stroke={`${GOLD}0.08)`} strokeWidth="0.5" />
        ))}

        {/* Horizontal lines */}
        {HORIZONTALS.map((y) => (
          <line key={`h-${y}`} x1="0" y1={y} x2="100%" y2={y} stroke={`${GOLD}0.08)`} strokeWidth="0.5" />
        ))}

        {/* Dot markers at each intersection */}
        {VERTICALS.map((x) =>
          HORIZONTALS.map((y) => (
            <circle key={`d-${x}-${y}`} cx={x} cy={y} r="1.5" fill={`${GOLD}0.18)`} />
          ))
        )}
      </svg>
    </div>
  )
}
