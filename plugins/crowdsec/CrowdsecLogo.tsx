/** Inline CrowdSec mark — no external image request (works in Docker/offline). */
export function CrowdsecLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      className="cs-logo-svg"
    >
      <defs>
        <linearGradient id="cs-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5eb3ff" />
          <stop offset="100%" stopColor="#2b7fd4" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="currentColor" fillOpacity="0.12" stroke="url(#cs-logo-grad)" strokeWidth="2" />
      <path
        fill="url(#cs-logo-grad)"
        d="M32 12c-8 6-18 7-18 7v14c0 12 8 20 18 23 10-3 18-11 18-23V19s-10-1-18-7zm0 8c3 2 8 3 12 3v11c0 8-5 14-12 16-7-2-12-8-12-16V23c4 0 9-1 12-3z"
      />
    </svg>
  )
}
