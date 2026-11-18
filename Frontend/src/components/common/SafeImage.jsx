import React, { useState, useEffect } from 'react';

// In-memory cache for resolved object URLs to prevent redundant network fetches
const blobCache = new Map();

/**
 * Custom hook to safely resolve image URLs.
 * Automatically handles:
 * - Direct blob/data URLs
 * - External CDN/Unsplash URLs
 * - Localhost and relative /uploads URLs
 * - Ngrok-tunnelled URLs (fetches with header to bypass ERR_NGROK_6024 interstitial warning)
 */
export const useSafeImageUrl = (src) => {
  const [resolvedSrc, setResolvedSrc] = useState(() => {
    if (!src) return '';
    if (src.startsWith('blob:') || src.startsWith('data:')) return src;
    if (blobCache.has(src)) return blobCache.get(src);
    // If not ngrok, safe to use directly
    if (!/ngrok/i.test(src)) return src;
    return '';
  });
  const [loading, setLoading] = useState(() => {
    if (!src) return false;
    if (src.startsWith('blob:') || src.startsWith('data:')) return false;
    if (blobCache.has(src)) return false;
    return /ngrok/i.test(src);
  });
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setResolvedSrc('');
      setLoading(false);
      setError(false);
      return;
    }

    // Direct memory or base64
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setResolvedSrc(src);
      setLoading(false);
      setError(false);
      return;
    }

    // Check memory cache
    if (blobCache.has(src)) {
      setResolvedSrc(blobCache.get(src));
      setLoading(false);
      setError(false);
      return;
    }

    // If non-ngrok URL, use directly without fetch overhead
    if (!/ngrok/i.test(src)) {
      setResolvedSrc(src);
      setLoading(false);
      setError(false);
      return;
    }

    // For ngrok URLs: browser <img> tags cannot pass custom headers,
    // which triggers ngrok's ERR_NGROK_6024 warning page instead of binary image bytes.
    // We fetch with the header, convert to a Blob URL, and cache it.
    let isCancelled = false;
    setLoading(true);
    setError(false);

    fetch(src, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load image via ngrok: ${response.status}`);
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        blobCache.set(src, objectUrl);
        if (!isCancelled) {
          setResolvedSrc(objectUrl);
          setLoading(false);
          setError(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('SafeImage ngrok bypass fetch fallback:', err);
          // Fallback to direct URL so browser default error handling can take over
          setResolvedSrc(src);
          setLoading(false);
          setError(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [src]);

  return { resolvedSrc, loading, error };
};

/**
 * Universal SafeImage component
 * Drop-in replacement for standard <img> tags.
 * Supports fallback UI, graceful error states, and automatic ngrok bypass.
 */
export const SafeImage = ({
  src,
  alt = '',
  style = {},
  className = '',
  fallback = null,
  onError = null,
  onClick = null,
  ...rest
}) => {
  const { resolvedSrc, loading, error } = useSafeImageUrl(src);
  const [hasRenderError, setHasRenderError] = useState(false);

  useEffect(() => {
    setHasRenderError(false);
  }, [src]);

  const handleImgError = (e) => {
    setHasRenderError(true);
    if (typeof onError === 'function') {
      onError(e);
    }
  };

  if (!src || hasRenderError || (error && !resolvedSrc)) {
    return fallback || null;
  }

  if (loading && !resolvedSrc) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--bg-muted, rgba(255,255,255,0.05))',
          animation: 'pulse 1.5s infinite',
          ...style
        }}
        className={className}
      />
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      style={style}
      className={className}
      onError={handleImgError}
      onClick={onClick}
      {...rest}
    />
  );
};

export default SafeImage;
