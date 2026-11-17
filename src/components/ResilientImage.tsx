import { useEffect, useState } from 'react';
import { Mountain } from 'lucide-react';
import { resolveAssetUrl } from '../utils/assetUrl';

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
  const resolvedSrc = resolveAssetUrl(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [resolvedSrc]);

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
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
