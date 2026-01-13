"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const savedKey = typeof window !== 'undefined' ? sessionStorage.getItem('openai_api_key') : '';
    const savedModel = typeof window !== 'undefined' ? sessionStorage.getItem('openai_model') : '';
    if (savedKey) {
      setHasKey(true);
      setApiKeyInput(savedKey.replace(/.(?=.{4})/g, '•'));
    }
    if (savedModel) setModel(savedModel);
  }, []);

  const handleSaveSettings = () => {
    // Salva SOLO in sessionStorage (non persistente tra sessioni)
    if (typeof window !== 'undefined') {
      const inputElement = document.getElementById('openai-key-input');
      const realValue = inputElement && inputElement.value ? inputElement.value.trim() : '';
      if (!realValue) {
        alert('Inserisci una OpenAI API Key valida.');
        return;
      }
      sessionStorage.setItem('openai_api_key', realValue);
      sessionStorage.setItem('openai_model', model);
      setHasKey(true);
      setShowSettings(false);
    }
  };

  const handleClearKey = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('openai_api_key');
      setHasKey(false);
      setApiKeyInput('');
    }
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/clear-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Cache pulita con successo! Rimossi ${data.clearedItems} elementi.`);
      } else {
        alert('Errore durante la pulizia della cache.');
      }
    } catch (error) {
      console.error('Errore durante la pulizia della cache:', error);
      alert('Errore durante la pulizia della cache.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <img 
                src="/Icona-Flowino.png" 
                alt="Flowino Logo" 
                style={{ width: '80px', height: '80px', objectFit: 'contain' }}
              />
              <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#0094B5', margin: 0 }}>
                Mermaid Code Generator
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '6px', border: '2px solid #0094B5', color: '#0094B5', background: 'rgba(0, 148, 181, 0.1)', cursor: 'pointer', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(0, 148, 181, 0.2)'; e.target.style.color = '#F3832C'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(0, 148, 181, 0.1)'; e.target.style.color = '#0094B5'; }}
            >
              Impostazioni API
            </button>
            <button
              onClick={handleClearCache}
              style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', border: '2px solid #F3832C', color: '#F3832C', background: 'rgba(243, 131, 44, 0.1)', cursor: 'pointer', transition: 'all 0.3s ease' }}
              title="Pulisce la cache dei risultati per forzare nuove generazioni"
              onMouseEnter={(e) => { e.target.style.background = 'rgba(243, 131, 44, 0.2)'; e.target.style.color = '#0094B5'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(243, 131, 44, 0.1)'; e.target.style.color = '#F3832C'; }}
            >
              Pulisci Cache
            </button>
            {hasKey ? (
              <span style={{ fontSize: '0.75rem', color: '#0094B5', fontWeight: 500, background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>API Key caricata (sessione)</span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#F3832C', fontWeight: 500, background: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>API Key non impostata</span>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 style={{ fontSize: '3rem', fontWeight: 700, color: '#0094B5', marginBottom: '1rem', fontFamily: '"Syne", sans-serif' }}>Genera il tuo codice Mermaid</h1>
          <p style={{ fontSize: '1.125rem', color: '#F3832C', marginBottom: '2rem', maxWidth: '48rem', margin: '0 auto 2rem' }}>
            Dai vita alle tue idee trasformando semplici testi in diagrammi e flow-chart complessi. La nostra applicazione web ti permette di creare visualizzazioni chiare e professionali in pochi click.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => router.push('/input-testo')}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '1.125rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' }}
              onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'; }}
            >
              Inserisci il tuo testo
            </button>
            <button 
              onClick={() => router.push('/disegno')}
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#F3832C', padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '1.125rem', fontWeight: 600, border: '2px solid rgba(243, 131, 44, 0.3)', cursor: 'pointer', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(243, 131, 44, 0.2)'; e.target.style.borderColor = '#F3832C'; e.target.style.color = '#0094B5'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(243, 131, 44, 0.3)'; e.target.style.color = '#F3832C'; }}
            >
              Disegna lo schema o carica immagine
            </button>
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#F3832C' }}>
            Input massimo: 20.000 caratteri (~6 pagine). Riferimenti sintassi Mermaid: 
            <a style={{ color: '#0094B5', textDecoration: 'underline', marginLeft: '0.25rem' }} href="https://mermaid.js.org/intro/syntax-reference.html" target="_blank" rel="noreferrer" onMouseEnter={(e) => e.target.style.color = '#F3832C'} onMouseLeave={(e) => e.target.style.color = '#0094B5'}>Documentazione ufficiale</a>
          </p>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#F3832C' }}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setShowVideo(true);
              }}
              style={{ color: '#0094B5', textDecoration: 'underline', cursor: 'pointer' }}
              onMouseEnter={(e) => e.target.style.color = '#F3832C'}
              onMouseLeave={(e) => e.target.style.color = '#0094B5'}
            >
              Guarda il video tutorial dell'APP
            </a>
          </p>
        </div>
      </main>
      
      <footer style={{ padding: '1.5rem', marginTop: '4rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div className="container mx-auto">
          <div style={{ textAlign: 'center', color: '#F3832C', fontSize: '0.875rem' }}>
            <p style={{ marginBottom: '0.5rem', color: '#0094B5', fontSize: '0.875rem' }}>
              APP realizzata da <strong style={{ color: '#0094B5' }}>Roberto Micarelli</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
              <a
                href="https://www.ai-utati.it"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#F3832C', textDecoration: 'none', transition: 'color 0.3s ease' }}
                onMouseEnter={(e) => e.target.style.color = '#0094B5'}
                onMouseLeave={(e) => e.target.style.color = '#F3832C'}
              >
                https://www.ai-utati.it
              </a>
              <span style={{ color: '#666' }}>-</span>
              <a
                href="mailto:roberto@ai-utati.it"
                style={{ color: '#F3832C', textDecoration: 'none', transition: 'color 0.3s ease' }}
                onMouseEnter={(e) => e.target.style.color = '#0094B5'}
                onMouseLeave={(e) => e.target.style.color = '#F3832C'}
              >
                roberto@ai-utati.it
              </a>
            </div>
          </div>
        </div>
      </footer>

      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="rounded-xl shadow-2xl w-full max-w-lg p-6" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem', color: '#0094B5', fontFamily: '"Syne", sans-serif' }}>Impostazioni API OpenAI</h3>
            <p style={{ fontSize: '0.875rem', color: '#F3832C', marginBottom: '1rem' }}>La chiave viene usata solo in questa sessione del browser (sessionStorage) e inviata esclusivamente alla tua API locale per effettuare la richiesta a OpenAI. Non viene salvata su server.</p>

            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0094B5', marginBottom: '0.25rem' }}>OpenAI API Key</label>
            <input
              id="openai-key-input"
              type="password"
              placeholder="sk-..."
              style={{ width: '100%', border: '2px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.9)', color: '#1a1a2e' }}
            />

            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0094B5', marginBottom: '0.25rem' }}>Modello</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ width: '100%', border: '2px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.9)', color: '#1a1a2e' }}
            >
              <option value="gpt-4">gpt-4</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </select>

            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2">
                <button onClick={handleSaveSettings} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>Salva</button>
                <button onClick={() => setShowSettings(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '2px solid rgba(255, 255, 255, 0.2)', fontWeight: 500, background: 'rgba(255, 255, 255, 0.1)', color: '#F3832C', cursor: 'pointer' }}>Annulla</button>
              </div>
              {hasKey && (
                <button onClick={handleClearKey} style={{ color: '#F3832C', fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>Rimuovi chiave</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showVideo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="rounded-xl shadow-2xl w-full max-w-4xl p-6" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0094B5', fontFamily: '"Syne", sans-serif' }}>Video Tutorial Mermaid Code Generator</h3>
              <button 
                onClick={() => setShowVideo(false)}
                style={{ color: '#F3832C', fontSize: '1.5rem', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.target.style.color = '#0094B5'}
                onMouseLeave={(e) => e.target.style.color = '#F3832C'}
              >
                ×
              </button>
            </div>
            <div style={{padding:'56.25% 0 0 0', position:'relative'}}>
              <iframe 
                src="https://player.vimeo.com/video/1112090722?h=9585e60e84&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" 
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                style={{position:'absolute', top:0, left:0, width:'100%', height:'100%'}} 
                title="Tutorial Mermaid Code Generator"
              />
            </div>
            <script src="https://player.vimeo.com/api/player.js"></script>
          </div>
        </div>
      )}
    </div>
  );
}
