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
          <div className="flex items-center gap-2">
            <img src="/loghi/logo192.png" alt="Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-[#111418]">Mermaid Code Generator (By Roberto Micarelli)</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-sm font-semibold rounded-md border border-[#0d78f2] text-[#0d78f2] hover:bg-gray-50"
            >
              Impostazioni API
            </button>
            <button
              onClick={handleClearCache}
              className="px-3 py-2 text-xs font-semibold rounded-md border border-orange-500 text-orange-600 hover:bg-orange-50"
              title="Pulisce la cache dei risultati per forzare nuove generazioni"
            >
              Pulisci Cache
            </button>
            {hasKey ? (
              <span className="text-xs text-green-600 font-medium">API Key caricata (sessione)</span>
            ) : (
              <span className="text-xs text-red-600 font-medium">API Key non impostata</span>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold text-[#111418] lg:text-5xl mb-4">Genera il tuo codice Mermaid</h1>
          <p className="text-base text-[#637488] lg:text-lg mb-8 max-w-3xl mx-auto">
            Dai vita alle tue idee trasformando semplici testi in diagrammi e flow-chart complessi. La nostra applicazione web ti permette di creare visualizzazioni chiare e professionali in pochi click.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => router.push('/input-testo')}
              className="bg-[#0d78f2] text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-lg font-semibold transition-colors"
            >
              Inserisci il tuo testo
            </button>
            <button 
              onClick={() => router.push('/disegno')}
              className="bg-white text-[#0d78f2] px-6 py-3 rounded-lg border border-[#0d78f2] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-lg font-semibold transition-colors"
            >
              Disegna lo schema o carica immagine
            </button>
          </div>
          <p className="mt-6 text-sm text-[#637488]">
            Input massimo: 20.000 caratteri (~6 pagine). Riferimenti sintassi Mermaid: 
            <a className="text-[#0d78f2] underline ml-1" href="https://mermaid.js.org/intro/syntax-reference.html" target="_blank" rel="noreferrer">Documentazione ufficiale</a>
          </p>
          <p className="mt-4 text-sm text-[#637488]">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setShowVideo(true);
              }}
              className="text-[#0d78f2] underline hover:text-blue-800 cursor-pointer"
            >
              Guarda il video tutorial dell'APP
            </a>
          </p>
        </div>
      </main>
      
      <footer className="p-6">
        <div className="container mx-auto">
          <p className="text-center text-sm text-[#637488]">© 2024 Mermaid Code Generator. Tutti i diritti riservati (By Roberto Micarelli)</p>
        </div>
      </footer>

      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-1">Impostazioni API OpenAI</h3>
            <p className="text-sm text-gray-600 mb-4">La chiave viene usata solo in questa sessione del browser (sessionStorage) e inviata esclusivamente alla tua API locale per effettuare la richiesta a OpenAI. Non viene salvata su server.</p>

            <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
            <input
              id="openai-key-input"
              type="password"
              placeholder="sk-..."
              className="w-full border rounded-md px-3 py-2 mb-4"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Modello</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mb-4"
            >
              <option value="gpt-4">gpt-4</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </select>

            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2">
                <button onClick={handleSaveSettings} className="bg-[#0d78f2] text-white px-4 py-2 rounded-md font-medium">Salva</button>
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-md border font-medium">Annulla</button>
              </div>
              {hasKey && (
                <button onClick={handleClearKey} className="text-red-600 text-sm font-medium">Rimuovi chiave</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showVideo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Video Tutorial Mermaid Code Generator</h3>
              <button 
                onClick={() => setShowVideo(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
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
