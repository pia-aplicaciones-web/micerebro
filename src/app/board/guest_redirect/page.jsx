'use client';

import React, { useEffect } from 'react';

export default function GuestRedirectPage() {
  useEffect(() => {
    // Crear un usuario invitado temporal
    const guestUser = {
      uid: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: null,
      displayName: 'Invitado',
      isGuest: true
    };

    // Crear un boardId único para el invitado
    const boardId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Guardar información temporal del invitado en localStorage
    localStorage.setItem('guestUser', JSON.stringify({
      uid: guestUser.uid,
      displayName: guestUser.displayName,
      boardId: boardId,
      createdAt: new Date().toISOString()
    }));

    // Redirigir al tablero real
    const finalBoardId = boardId;
    window.location.href = `/board/${finalBoardId}/`;
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center" style={{ backgroundColor: '#96e4e6' }}>
      <div className="text-center">
        <div className="h-16 w-16 bg-black rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto">
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
        <p className="text-lg font-semibold text-slate-900">Creando tu tablero personal...</p>
        <p className="text-sm text-slate-600 mt-2">Solo tomará un momento</p>
      </div>
    </div>
  );
}