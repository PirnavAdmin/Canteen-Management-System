import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <FileQuestion size={32} />
      </div>
      <h1 style={{
        fontSize: '28px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
        margin: '0 0 8px 0'
      }}>
        404 – Page Not Found
      </h1>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-secondary)',
        maxWidth: '480px',
        margin: '0 0 24px 0',
        lineHeight: 1.5
      }}>
        The requested URL was not found within the SMS / CMS Canteen Management portal. Please check the route or navigate back.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          icon={Home}
          onClick={() => navigate('/canteen')}
        >
          Canteen Management Home
        </Button>
      </div>
    </div>
  );
};

