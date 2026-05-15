'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  Mail,
  Radio,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

/* ── Free products description ─────────────────────────────── */
const FREE_PRODUCTS = [
  {
    name: 'El Radar',
    desc: 'Monitoreo diario de señales mediáticas y presencia en prensa.',
  },
  {
    name: 'Voz y Voto',
    desc: 'Análisis semanal de pronunciamientos y posiciones legislativas.',
  },
  {
    name: 'El Hilo',
    desc: 'Conexiones y narrativas que cruzan la agenda política boliviana.',
  },
  {
    name: 'Foco de la Semana',
    desc: 'Profundización temática: un eje, una mirada, cada semana.',
  },
];

/* ── Shared styles ─────────────────────────────────────────── */
const S = {
  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: '#64748b',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    backgroundColor: 'rgba(0,255,136,0.04)',
    border: '1px solid #1a2744',
    color: '#e2e8f0',
    outline: 'none',
    fontFamily: "'JetBrains Mono', monospace",
    boxShadow: '0 0 8px rgba(0,255,136,0.04)',
    transition: 'all 0.2s',
  },
  inputFocus: {
    borderColor: 'rgba(0,255,136,0.4)',
    boxShadow: '0 0 15px rgba(0,255,136,0.1)',
  },
  cardBg: {
    background: 'linear-gradient(135deg, rgba(0,255,136,0.03) 0%, rgba(13,19,33,0.9) 50%, rgba(6,182,212,0.03) 100%)',
    border: '1px solid rgba(0,255,136,0.1)',
  },
};

export default function SuscribirPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [consentComms, setConsentComms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /* ── Email validation ────────────────────────────────────── */
  const validateEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  /* ── Submit handler ──────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !validateEmail(email.trim())) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!consentComms) {
      setError('Debes aceptar recibir comunicaciones periódicas para continuar.');
      return;
    }

    if (!consentPrivacy) {
      setError('Debes confirmar la política de datos para continuar.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/suscriptores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim() || null,
          origen: 'landing',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          throw new Error(
            'Este correo electrónico ya está suscrito. Si deseas actualizar tus datos, contáctanos.'
          );
        }
        throw new Error(data.error || 'Error al procesar la suscripción.');
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error desconocido. Intenta nuevamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success state ───────────────────────────────────────── */
  if (success) {
    return (
      <div className="space-y-8">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0,255,136,0.1)',
              border: '1px solid rgba(0,255,136,0.25)',
            }}
          >
            <span style={{ color: '#00ff88' }} className="text-lg font-bold">D</span>
          </div>
          <div className="text-center">
            <p
              className="text-xs font-bold tracking-wider uppercase"
              style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}
            >
              DECODEX BOLIVIA
            </p>
            <p
              className="text-[11px]"
              style={{ color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}
            >
              Inteligencia de Señales
            </p>
          </div>
        </div>

        {/* Success message */}
        <div
          className="rounded-xl p-6 text-center space-y-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,19,33,0.9) 50%, rgba(6,182,212,0.04) 100%)',
            border: '1px solid rgba(0,255,136,0.2)',
            boxShadow: '0 0 25px rgba(0,255,136,0.06)',
          }}
        >
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center mx-auto"
            style={{
              backgroundColor: 'rgba(0,255,136,0.1)',
              border: '1px solid rgba(0,255,136,0.25)',
            }}
          >
            <CheckCircle2 size={32} style={{ color: '#00ff88' }} />
          </div>
          <div className="space-y-2">
            <h2
              className="text-lg font-bold"
              style={{ color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}
            >
              ¡Suscripción exitosa!
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {nombre
                ? `Gracias, ${nombre}.`
                : '¡Gracias por suscribirte!'}{' '}
              A partir de ahora recibirás{' '}
              <span style={{ color: '#e2e8f0' }}>El Radar</span>,{' '}
              <span style={{ color: '#e2e8f0' }}>Voz y Voto</span>,{' '}
              <span style={{ color: '#e2e8f0' }}>El Hilo</span> y{' '}
              <span style={{ color: '#e2e8f0' }}>Foco de la Semana</span>{' '}
              directamente en tu correo electrónico.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs justify-center" style={{ color: '#64748b' }}>
            <Mail size={14} />
            <span>Revisa tu bandeja de entrada (y carpeta de spam).</span>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col items-center gap-2 text-xs">
          <Link
            href="/dashboard"
            className="transition-colors underline underline-offset-2"
            style={{ color: '#64748b' }}
          >
            ¿Eres cliente? Accede al panel de administración
          </Link>
          <Link
            href="/agente"
            className="transition-colors underline underline-offset-2"
            style={{ color: '#64748b' }}
          >
            ¿Eres agente comercial? Accede al portal
          </Link>
        </div>
      </div>
    );
  }

  /* ── Form state ──────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* ── DECODEX Branding ──────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0,255,136,0.1)',
            border: '1px solid rgba(0,255,136,0.25)',
            boxShadow: '0 0 15px rgba(0,255,136,0.06)',
          }}
        >
          <span style={{ color: '#00ff88' }} className="text-lg font-bold">D</span>
        </div>
        <div className="text-center">
          <p
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}
          >
            DECODEX BOLIVIA
          </p>
          <p
            className="text-[11px]"
            style={{ color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}
          >
            Inteligencia de Señales
          </p>
        </div>
      </div>

      {/* ── Title & subtitle ──────────────────────────────────── */}
      <div className="text-center space-y-2">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}
        >
          Suscripción Gratuita
        </h1>
        <p
          className="text-sm leading-relaxed max-w-sm mx-auto"
          style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}
        >
          Recibe{' '}
          <span style={{ color: '#e2e8f0' }}>El Radar</span>,{' '}
          <span style={{ color: '#e2e8f0' }}>Voz y Voto</span>,{' '}
          <span style={{ color: '#e2e8f0' }}>El Hilo</span> y{' '}
          <span style={{ color: '#e2e8f0' }}>Foco de la Semana</span>{' '}
          directamente en tu email.
        </p>
      </div>

      {/* ── Products overview ─────────────────────────────────── */}
      <div className="rounded-xl p-5" style={S.cardBg}>
        <div className="grid gap-3">
          {FREE_PRODUCTS.map((p) => (
            <div key={p.name} className="flex items-start gap-3">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: 'rgba(0,255,136,0.08)',
                  border: '1px solid rgba(0,255,136,0.15)',
                }}
              >
                <Radio size={14} style={{ color: '#00ff88' }} />
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {p.name}
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: '#64748b' }}
                >
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Subscription form ─────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error banner */}
        {error && (
          <div
            className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
            style={{
              backgroundColor: 'rgba(255,51,85,0.08)',
              border: '1px solid rgba(255,51,85,0.2)',
              color: '#ff3355',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* nombre */}
        <div className="space-y-1.5">
          <label htmlFor="suscribir-nombre" style={S.label}>
            Nombre
          </label>
          <input
            id="suscribir-nombre"
            placeholder="Tu nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoComplete="name"
            style={S.input}
            onFocus={(e) => Object.assign(e.target.style, S.inputFocus)}
            onBlur={(e) => { e.target.style.borderColor = '#1a2744'; e.target.style.boxShadow = '0 0 8px rgba(0,255,136,0.04)'; }}
          />
        </div>

        {/* email */}
        <div className="space-y-1.5">
          <label htmlFor="suscribir-email" style={S.label}>
            Correo electrónico <span style={{ color: '#ff3355' }}>*</span>
          </label>
          <input
            id="suscribir-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={S.input}
            onFocus={(e) => Object.assign(e.target.style, S.inputFocus)}
            onBlur={(e) => { e.target.style.borderColor = '#1a2744'; e.target.style.boxShadow = '0 0 8px rgba(0,255,136,0.04)'; }}
          />
        </div>

        {/* whatsapp */}
        <div className="space-y-1.5">
          <label htmlFor="suscribir-whatsapp" style={S.label}>
            WhatsApp{' '}
            <span style={{ color: '#334155', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>
              (opcional)
            </span>
          </label>
          <input
            id="suscribir-whatsapp"
            type="tel"
            placeholder="+591 70000000"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            autoComplete="tel"
            style={S.input}
            onFocus={(e) => Object.assign(e.target.style, S.inputFocus)}
            onBlur={(e) => { e.target.style.borderColor = '#1a2744'; e.target.style.boxShadow = '0 0 8px rgba(0,255,136,0.04)'; }}
          />
          <p
            className="text-[11px]"
            style={{ color: '#334155' }}
          >
            Formato boliviano: +591 seguido de tu número (ej. +591 70000000)
          </p>
        </div>

        <input type="hidden" name="origen" value="landing" readOnly />

        {/* Checkboxes */}
        <div className="space-y-4 pt-1">
          <label className="flex items-start gap-3 group" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={consentComms}
              onChange={(e) => setConsentComms(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded accent-[#00ff88] cursor-pointer"
              style={{ accentColor: '#00ff88' }}
            />
            <span
              className="text-sm leading-relaxed transition-colors"
              style={{ color: '#64748b' }}
            >
              Acepto recibir comunicaciones periódicas de DECODEX Bolivia.
              <span style={{ color: '#ff3355' }}>*</span>
            </span>
          </label>

          <label className="flex items-start gap-3 group" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={consentPrivacy}
              onChange={(e) => setConsentPrivacy(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded cursor-pointer"
              style={{ accentColor: '#00ff88' }}
            />
            <span
              className="text-sm leading-relaxed transition-colors"
              style={{ color: '#64748b' }}
            >
              Confirmo que mis datos no serán compartidos con terceros y serán
              utilizados exclusivamente para el envío de boletines gratuitos.
              <span style={{ color: '#ff3355' }}>*</span>
            </span>
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            backgroundColor: submitting ? 'rgba(0,255,136,0.08)' : 'rgba(0,255,136,0.12)',
            border: '1px solid rgba(0,255,136,0.3)',
            color: '#00ff88',
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: submitting ? '0 0 20px rgba(0,255,136,0.15)' : '0 0 8px rgba(0,255,136,0.08)',
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              Suscribirme — Es gratuito
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* ── Privacy section ────────────────────────────────────── */}
      <div className="rounded-xl p-5" style={S.cardBg}>
        <div className="flex items-start gap-3">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: 'rgba(6,182,212,0.1)',
              border: '1px solid rgba(6,182,212,0.2)',
            }}
          >
            <Shield size={16} style={{ color: '#06b6d4' }} />
          </div>
          <div className="space-y-1.5">
            <p
              className="text-sm font-semibold"
              style={{ color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}
            >
              Política de Datos
            </p>
            <p
              className="text-xs leading-relaxed"
              style={{ color: '#64748b' }}
            >
              DECODEX Bolivia / ONION200 no vende, comparte ni comercializa
              los datos personales de sus suscriptores. Tu información es
              utilizada exclusivamente para el envío de los boletines
              gratuitos que has seleccionado. Puedes darte de baja en
              cualquier momento.
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer links ───────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2 text-xs pt-2">
        <Link
          href="/dashboard"
          className="transition-colors underline underline-offset-2"
          style={{ color: '#64748b' }}
        >
          ¿Eres cliente? Accede al panel de administración
        </Link>
        <Link
          href="/agente"
          className="transition-colors underline underline-offset-2"
          style={{ color: '#64748b' }}
        >
          ¿Eres agente comercial? Accede al portal
        </Link>
      </div>

      {/* ── Copyright ──────────────────────────────────────────── */}
      <p
        className="text-center pt-2"
        style={{ color: '#1a2744', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
      >
        &copy; {new Date().getFullYear()} DECODEX Bolivia &middot; ONION200
        &middot; Todos los derechos reservados
      </p>
    </div>
  );
}
