/**
 * FlowGenLogo — reusable brand mark component
 * Design: A task-list / workflow icon — three rows with checkboxes,
 * suggesting a work management tool. Subtle "F" negative space.
 * Matches the browser favicon exactly.
 *
 * Props:
 *   size   — pixel size of the icon square (default 36)
 *   className — extra classes on the wrapper div
 */
export default function FlowGenLogo({ size = 36, className = '' }) {
  return (
    <div style={{ width: size, height: size }} className={`flex-shrink-0 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        <defs>
          <linearGradient id="fg-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>

        {/* Background rounded square */}
        <rect width="48" height="48" rx="12" fill="url(#fg-bg)" />
        {/* Subtle top shine */}
        <rect x="1" y="1" width="46" height="18" rx="11" fill="white" fillOpacity="0.06" />

        {/* ── Row 1 — checked (bright) ─────────────────────── */}
        {/* Checkbox */}
        <rect x="9" y="10" width="8" height="8" rx="2" fill="white" />
        {/* Checkmark */}
        <path
          d="M11 14 L12.8 15.8 L16.5 11.5"
          stroke="#4F46E5"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Label bar — full width */}
        <rect x="20" y="12" width="19" height="4" rx="2" fill="white" />

        {/* ── Row 2 — in progress ──────────────────────────── */}
        <rect x="9" y="21" width="8" height="8" rx="2" fill="white" fillOpacity="0.75" />
        {/* Partial fill to suggest "in progress" */}
        <rect x="10.5" y="22.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.2" />
        {/* Label bar — ¾ width */}
        <rect x="20" y="23" width="14" height="4" rx="2" fill="white" fillOpacity="0.75" />

        {/* ── Row 3 — todo (dim) ───────────────────────────── */}
        <rect x="9" y="32" width="8" height="8" rx="2" fill="white" fillOpacity="0.35" />
        {/* Label bar — half width */}
        <rect x="20" y="34" width="9" height="4" rx="2" fill="white" fillOpacity="0.35" />
      </svg>
    </div>
  );
}
