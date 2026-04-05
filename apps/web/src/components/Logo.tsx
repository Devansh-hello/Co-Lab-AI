'use client';

/**
 * Logo Component
 *
 * Heavy typographic wordmark using Outfit Black (900).
 * Tight letter-spacing, lowercase "co-lab" in gold + dimmed "AI".
 * Used in header, footer, auth pages.
 *
 * Sizes: sm (header nav), md (footer), lg (auth/landing)
 */

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

const SIZES: Record<LogoSize, { brand: string; suffix: string }> = {
  sm: { brand: 'text-lg', suffix: 'text-xs' },
  md: { brand: 'text-xl', suffix: 'text-sm' },
  lg: { brand: 'text-3xl', suffix: 'text-base' },
};

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-baseline gap-1.5 select-none ${className}`}>
      <span
        className={s.brand}
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: '#D4AF37',
        }}
      >
        co-lab
      </span>
      <span
        className={s.suffix}
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          letterSpacing: '0.04em',
          color: 'rgba(255,255,255,0.3)',
          lineHeight: 1,
        }}
      >
        AI
      </span>
    </span>
  );
}
