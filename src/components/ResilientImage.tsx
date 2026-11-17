import { useState } from 'react';
import { Mountain } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackLabel = 'PAHANPIYASA CEYLON CAFÉ',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center px-4 py-6 text-center ${className}`}
        style={{
          backgroundColor: 'var(--surface-muted)',
          color: 'var(--text-secondary)',
        }}
      >
        <Mountain
          className="w-7 h-7 mb-2"
          strokeWidth={1.5}
          style={{ color: 'var(--accent)' }}
        />
        <span className="text-xs font-medium tracking-wide">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
