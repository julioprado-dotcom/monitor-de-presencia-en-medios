import Link from 'next/link';
import type { Metadata } from 'next';
import { UserMenu } from '@/components/user-menu';

export const metadata: Metadata = {
  title: 'Portal Agente — DECODEX Bolivia',
  description: 'Portal de agentes comerciales ONION200',
};

export default function AgenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#080c14' }}
    >
      {/* Top bar with DECODEX branding */}
      <header
        className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor: '#0d1321',
          borderBottom: '1px solid #1a2744',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0,255,136,0.1)',
              border: '1px solid rgba(0,255,136,0.25)',
            }}
          >
            <span
              className="text-[10px] font-bold"
              style={{ color: '#00ff88', fontFamily: "'JetBrains Mono', monospace" }}
            >
              D
            </span>
          </div>
          <div>
            <p
              className="text-xs font-bold leading-none"
              style={{ color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}
            >
              DECODEX BOLIVIA
            </p>
            <p
              className="text-[9px]"
              style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}
            >
              Portal Agente
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu compact />
          <Link
            href="/"
            className="text-[10px] transition-colors"
            style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}
          >
            &larr; Admin
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom branding */}
      <footer
        className="px-4 py-2 text-center"
        style={{
          backgroundColor: '#0d1321',
          borderTop: '1px solid #1a2744',
        }}
      >
        <p
          className="text-[10px]"
          style={{ color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}
        >
          DECODEX Bolivia &middot; Inteligencia de Señales
        </p>
      </footer>
    </div>
  );
}
