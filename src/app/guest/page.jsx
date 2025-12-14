import React from 'react';

export default function GuestPage() {
  // Esta página se renderiza en el servidor y hace redirect inmediato
  // No necesitamos useEffect ni JavaScript del cliente

  return (
    <html lang="es">
      <head>
        <title>Mi cerebro - Entrando como invitado...</title>
        <meta httpEquiv="refresh" content="0;url=/board/guest_redirect/" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#96e4e6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'black',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00ffaa" />
                  <stop offset="50%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#0066ff" />
                </linearGradient>
              </defs>
              <path d="M6 18C6 14 8 12 12 12C14 12 16 13 18 14C20 15 22 16 24 16C26 16 28 15 30 14C32 13 34 14 34 18C34 22 32 24 30 24C28 24 26 23 24 22C22 21 20 20 18 20C16 20 14 21 12 22C10 23 8 22 6 18Z" fill="url(#logoGradient)"/>
            </svg>
          </div>
          <p style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#0f172a',
            margin: 0
          }}>
            Preparando tu tablero de invitado...
          </p>
        </div>
      </body>
    </html>
  );
}