'use client';

import Image from 'next/image';
import { BinaryRainCanvas } from './BinaryRainCanvas';

/**
 * DECODEX Bolivia loading / splash screen.
 * Dark background with minimalist binary rain on the left,
 * centered logo, and pulsing "Cargando inteligencia..." text.
 */
export function LoadingScreen() {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ backgroundColor: '#0A1628' }}
    >
      {/* Binary rain canvas - full viewport, columns positioned in left 20% */}
      <BinaryRainCanvas />

      {/* Content - centered, slightly right to avoid rain overlap on small screens */}
      <div className="relative z-10 flex flex-col items-center px-4">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center">
          <div
            className="h-20 w-20 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(0, 255, 136, 0.15)' }}
          >
            <Image src="/logo.png" alt="DECODEX" width={72} height={72} className="object-cover" priority />
          </div>
        </div>

        {/* Brand name */}
        <h1
          className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2"
          style={{ color: '#E2E8F0' }}
        >
          DECODEX BOLIVIA
        </h1>

        {/* Subtitle with pulse animation */}
        <p
          className="text-sm sm:text-base font-medium animate-pulse"
          style={{ color: 'rgba(0, 255, 136, 0.7)' }}
        >
          Cargando inteligencia...
        </p>

        {/* Subtle dot pulse indicator */}
        <div className="mt-8 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block rounded-full animate-pulse"
              style={{
                width: 6,
                height: 6,
                backgroundColor: 'rgba(0, 255, 136, 0.4)',
                animationDelay: `${i * 300}ms`,
                animationDuration: '1.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom-right subtle branding */}
      <div
        className="absolute bottom-4 right-6 text-[10px] font-medium tracking-widest uppercase"
        style={{ color: 'rgba(226, 232, 240, 0.15)' }}
      >
        Inteligencia de Senales
      </div>
    </div>
  );
}
