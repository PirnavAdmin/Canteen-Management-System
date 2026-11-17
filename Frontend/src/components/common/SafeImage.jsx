import React, { useState, useEffect, useRef } from 'react';
import { resolveImageUrl } from '../../utils/formatters';

/**
 * SafeImage Component
 * Reliably loads images from local blobs, same-origin Vite proxy, external CDNs,
 * and remote ngrok backends with automatic fetch fallback and bypass headers.
 */
export const SafeImage = ({
  src,
  alt = 'Image',
  className = '',
  style = {},
  fallback = null,
  onError,
  onLoad,
  ...props
}) => {
  const [resolvedSrc, setResolvedSrc] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const blobUrlRef = useRef(null);

  // Clean up any generated blob object URLs to prevent memory leaks
  const cleanUpBlob = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  useEffect(() => {
    cleanUpBlob();
    setHasError(false);
    setIsLoading(true);

    if (!src) {
      setResolvedSrc('');
      setIsLoading(false);
      return;
    }

    // 1. Direct blob or data URLs require no resolution or fetch fallback
    if (typeof src === 'string' && (src.startsWith('blob:') || src.startsWith('data:'))) {
      setResolvedSrc(src);
      setIsLoading(false);
      return;
    }

    const initialResolved = resolveImageUrl(src);
    setResolvedSrc(initialResolved);
  }, [src]);

  useEffect(() => {
    return () => {
      cleanUpBlob();
    };
  }, []);

  const handleNativeError = async () => {
    // If already tried fallback or no src, trigger final error
    if (hasError || !resolvedSrc || resolvedSrc.startsWith('blob:') || resolvedSrc.startsWith('data:')) {
      setHasError(true);
      setIsLoading(false);
      if (onError) onError();
      return;
    }

    try {
      // Attempt background fetch with bypass header for ngrok / remote proxying
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(resolvedSrc, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.startsWith('image/')) {
        throw new Error(`Expected image content type, received: ${contentType}`);
      }

      const blob = await response.blob();
      cleanUpBlob();
      const objectUrl = URL.createObjectURL(blob);
      blobUrlRef.current = objectUrl;
      setResolvedSrc(objectUrl);
      setHasError(false);
    } catch {
      setHasError(true);
      setIsLoading(false);
      if (onError) onError();
    }
  };

  const handleNativeLoad = (e) => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) onLoad(e);
  };

  if (!resolvedSrc || hasError) {
    return fallback;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleNativeError}
      onLoad={handleNativeLoad}
      {...props}
    />
  );
};

export default SafeImage;
