"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
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
            <svg className="h-8 w-8 text-[#0d78f2]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
            <h1 className="text-xl font-bold text-[#111418]">Mermaid Code Generator</h1>
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
        </div>
      </main>
      
      <footer className="p-6">
        <div className="container mx-auto">
          <p className="text-center text-sm text-[#637488]">© 2024 Mermaid Code Generator. Tutti i diritti riservati.</p>
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
    </div>
  );
}
