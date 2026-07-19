export function TRIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="62 80 110 110"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TalentRadar icon"
    >
      <defs>
        <linearGradient id="trAccent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00FFD1" />
          <stop offset="100%" stopColor="#7B61FF" />
        </linearGradient>
        <linearGradient id="trAccentDiag" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFD1" />
          <stop offset="100%" stopColor="#7B61FF" />
        </linearGradient>
        <filter id="trGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Outer square */}
      <rect x="62" y="80" width="110" height="110" rx="16" fill="none" stroke="url(#trAccent)" strokeWidth="2" />
      {/* Inner square */}
      <rect x="78" y="96" width="78" height="78" rx="9" fill="none" stroke="rgba(0,255,209,0.25)" strokeWidth="1.5" />
      {/* Corner dots */}
      <circle cx="78"  cy="96"  r="5" fill="#00FFD1" filter="url(#trGlow)" />
      <circle cx="156" cy="96"  r="5" fill="#7B61FF" filter="url(#trGlow)" />
      <circle cx="78"  cy="174" r="5" fill="#7B61FF" filter="url(#trGlow)" />
      <circle cx="156" cy="174" r="5" fill="#00FFD1" filter="url(#trGlow)" />
      {/* Circuit tick marks */}
      <line x1="117" y1="80"  x2="117" y2="72"  stroke="#00FFD1" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="172" y1="135" x2="180" y2="135" stroke="#7B61FF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="117" y1="190" x2="117" y2="198" stroke="#7B61FF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="62"  y1="135" x2="54"  y2="135" stroke="#00FFD1" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      {/* TR letterforms */}
      <text
        x="117" y="151"
        fontFamily="'Arial Black', sans-serif"
        fontSize="34"
        fontWeight="900"
        fill="url(#trAccentDiag)"
        textAnchor="middle"
        dominantBaseline="middle"
        filter="url(#trGlow)"
      >
        TR
      </text>
    </svg>
  );
}
