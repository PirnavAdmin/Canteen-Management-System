import React, { useState } from 'react';
import { QrCode as QrIcon, RefreshCw } from 'lucide-react';

export const DynamicQrCode = ({
  value,
  size = 150,
  alt = 'Scan to Pay via UPI',
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!value) {
    return (
      <div style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px dashed #cbd5e1',
        color: '#94a3b8'
      }}>
        <QrIcon size={36} />
      </div>
    );
  }

  const encodedData = encodeURIComponent(value);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodedData}&margin=4&format=svg`;

  return (
    <div style={{
      width: size,
      height: size,
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      overflow: 'hidden'
    }} className={className}>
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <RefreshCw size={20} style={{ color: '#0284c7', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {error ? (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '8px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '11px'
        }}>
          <QrIcon size={32} style={{ color: '#0f172a', marginBottom: '4px' }} />
          <span>Dynamic QR Ready</span>
        </div>
      ) : (
        <img
          src={qrUrl}
          alt={alt}
          width={size}
          height={size}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.2s ease'
          }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
};

export default DynamicQrCode;
