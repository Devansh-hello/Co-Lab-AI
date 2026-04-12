"use client"

const GOLD = "rgba(230,179,62,"

const VERTICALS = ["25%", "50%", "75%"]
const HORIZONTALS = ["25%", "50%", "75%"]

export function GridOverlay() {
  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {VERTICALS.map((x) => (
          <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100%" stroke={`${GOLD}0.06)`} strokeWidth="0.5" />
        ))}
        {HORIZONTALS.map((y) => (
          <line key={`h-${y}`} x1="0" y1={y} x2="100%" y2={y} stroke={`${GOLD}0.06)`} strokeWidth="0.5" />
        ))}
        {VERTICALS.map((x) =>
          HORIZONTALS.map((y) => (
            <circle key={`d-${x}-${y}`} cx={x} cy={y} r="1" fill={`${GOLD}0.12)`} />
          ))
        )}
      </svg>
    </div>
  )
}
