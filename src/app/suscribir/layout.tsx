import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suscripción Gratuita — DECODEX Bolivia',
  description:
    'Suscríbete gratis a El Radar, Voz y Voto, El Hilo y más boletines de inteligencia de señales.',
};

export default function SuscribirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: '#080c14' }}
    >
      {/* Scan lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(6,182,212,0.015) 3px, rgba(6,182,212,0.015) 4px)',
        }}
      />
      <main className="relative z-10 flex-1 flex items-start justify-center pt-8 pb-16 px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
