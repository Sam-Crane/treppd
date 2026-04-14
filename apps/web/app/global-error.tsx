'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error-boundary]', error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, sans-serif',
            background: '#f9fafb',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '1rem',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Critical error
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
              The application crashed. Please reload.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: '1.5rem',
                padding: '0.5rem 1rem',
                background: '#1a365d',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
