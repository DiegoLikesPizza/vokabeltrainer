'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useToast } from './ToastProvider';
import Link from 'next/link';

export function AuthForms({ loginAction, registerAction }) {
  const [mode, setMode] = useState('LANDING'); // LANDING, LOGIN, REGISTER
  
  if (mode === 'LANDING') {
    return (
      <div className="landing-actions">
        <button className="btn btn-primary btn-lg" onClick={() => setMode('LOGIN')}>
          <span className="btn-icon">👤</span> Einloggen
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => setMode('REGISTER')}>
          <span className="btn-icon">📝</span> Account erstellen
        </button>
        <div style={{ width: '100%', marginTop: '10px' }}>
          <Link href="/guest" className="btn btn-ghost" style={{ width: '100%', textDecoration: 'none' }}>
            🏃 Als Gast fortfahren (kein Account nötig)
          </Link>
        </div>
      </div>
    );
  }

  if (mode === 'LOGIN') {
    return <LoginForm loginAction={loginAction} onBack={() => setMode('LANDING')} />;
  }

  if (mode === 'REGISTER') {
    return <RegisterForm registerAction={registerAction} onBack={() => setMode('LANDING')} />;
  }
}

function LoginForm({ loginAction, onBack }) {
  const toast = useToast();
  
  const [error, action, isPending] = useActionState(async (prev, formData) => {
    const res = await loginAction(formData);
    if (res?.error) {
      if (typeof toast === 'function') toast('❌ ' + res.error);
    }
    return res?.error || null;
  }, null);

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px', textAlign: 'left' }}>
      <input type="text" name="username" placeholder="Benutzername" required className="answer-input" />
      <input type="password" name="password" placeholder="Passwort" required className="answer-input" />
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={isPending}>
          {isPending ? 'Lädt...' : 'Login'}
        </button>
        <button type="button" className="btn btn-secondary btn-lg" onClick={onBack}>Zurück</button>
      </div>
    </form>
  );
}

function RegisterForm({ registerAction, onBack }) {
  const toast = useToast();
  
  const [error, action, isPending] = useActionState(async (prev, formData) => {
    const res = await registerAction(formData);
    if (res?.error) {
      if (typeof toast === 'function') toast('❌ ' + res.error);
    }
    return res?.error || null;
  }, null);

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px', textAlign: 'left' }}>
      <input type="text" name="access_key" placeholder="Zugangscode (Access Key)" required className="answer-input" />
      <input type="text" name="username" placeholder="Benutzername" required className="answer-input" />
      <input type="password" name="password" placeholder="Passwort" required className="answer-input" />
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={isPending}>
          {isPending ? 'Lädt...' : 'Erstellen'}
        </button>
        <button type="button" className="btn btn-secondary btn-lg" onClick={onBack}>Zurück</button>
      </div>
    </form>
  );
}

export function AIPromptPanel({ promptText }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    let successful = false;

    const notify = (msg) => {
      if (typeof toast === 'function') toast(msg);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(promptText).then(() => {
        setCopied(true);
        notify('📋 Prompt kopiert!');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => notify('❌ Fehler beim Kopieren'));
      return;
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = promptText;
      textarea.style.position = 'fixed';
      textarea.style.left = '-99999px';
      document.body.appendChild(textarea);
      textarea.select();
      successful = document.execCommand('copy');
      textarea.remove();
    } catch (e) {
      successful = false;
    }

    if (successful) {
      setCopied(true);
      notify('📋 Prompt kopiert!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      notify('❌ Fehler beim Kopieren');
    }
  };

  return (
    <div className="ai-prompt-panel">
      <div className="ai-prompt-header">
        <h3>🤖 KI-Scanner nutzen</h3>
        <button className={`btn btn-secondary btn-sm ${copied ? 'btn-success' : ''}`} onClick={handleCopy} style={{padding: '6px 12px', fontSize: '0.8rem', color: copied ? '#000': ''}}>
          {copied ? '✅ Kopiert' : '📋 Kopieren'}
        </button>
      </div>
      <p className="ai-prompt-desc">Mach ein Foto deiner Vokabeln, sende es an eine KI (wie ChatGPT oder Claude) und füge diesen Prompt ein, um die passende JSON-Datei zu generieren:</p>
      <pre className="ai-prompt-code">{promptText}</pre>
    </div>
  );
}
