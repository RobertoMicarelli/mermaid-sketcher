"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function InputTesto() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  const handleGenerateMermaid = async () => {
    if (!text || text.trim().length === 0) {
      alert('Inserisci del testo.');
      return;
    }
    if (text.length > 20000) {
      alert('Il testo supera il limite di 20.000 caratteri.');
      return;
    }

    const apiKey = typeof window !== 'undefined' ? sessionStorage.getItem('openai_api_key') : '';
    const model = typeof window !== 'undefined' ? (sessionStorage.getItem('openai_model') || 'gpt-4') : 'gpt-4';
    if (!apiKey) {
      alert('Imposta la OpenAI API Key nelle Impostazioni API dal menu iniziale.');
      return;
    }

    setIsGenerating(true);
    setProcessingStep('Analisi del testo...');

    try {
      setProcessingStep('Comunicazione con OpenAI...');
      
      const res = await fetch('/api/generate-mermaid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model, inputText: text })
      });
      
      setProcessingStep('Elaborazione risposta...');
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore API');

      setProcessingStep('Salvataggio risultati...');

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('generated_mermaid_code', data.mermaid || '');
        sessionStorage.setItem('used_model', data.model || '');
      }
      
      setProcessingStep('Completato!');
      setTimeout(() => {
        router.push('/output');
      }, 500);
      
    } catch (err) {
      console.error(err);
      alert('Errore durante la generazione del codice Mermaid.');
    } finally {
      setIsGenerating(false);
      setProcessingStep('');
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(text);
  };

  const handleSaveAsTxt = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mermaid-code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-4 sm:px-10 py-4 shadow-sm">
          <div className="flex items-center gap-4 text-[#111418]">
            <img src="/loghi/logo192.png" alt="Logo" className="h-6 w-6" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Mermaid Code Generator (By Roberto Micarelli)</h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => router.push('/')}
              className="text-sm font-medium text-[#637488] hover:text-[#0d78f2] transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => router.push('/disegno')}
              className="text-sm font-medium text-[#637488] hover:text-[#0d78f2] transition-colors"
            >
              Disegno
            </button>
            <button 
              onClick={() => router.push('/output')}
              className="text-sm font-medium text-[#637488] hover:text-[#0d78f2] transition-colors"
            >
              Output
            </button>
            <button 
              onClick={() => router.push('/')}
              className="flex min-w-[120px] items-center justify-center rounded-md h-10 px-4 text-sm font-bold leading-normal tracking-wide shadow-md transition-all bg-[#0d78f2] text-white hover:bg-opacity-90"
            >
              <span className="truncate">Home</span>
            </button>
          </nav>
        </header>
        
        <main className="flex-1 px-4 sm:px-10 py-12">
          <div className="mx-auto max-w-4xl flex flex-col items-center">
            <div className="w-full">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-center mb-4">Input Testo</h1>
              <p className="text-base text-[#637488] mb-6 max-w-3xl text-center mx-auto">
                Incolla o digita il tuo testo nell'area sottostante. In alternativa, puoi caricare un file di testo (.txt) dal tuo dispositivo per generare il codice Mermaid corrispondente. Puoi anche caricare una immagine o creare te uno schema grafico con il mouse e generare il codice oppure caricare una foto con uno schema e tradurlo in codice Mermaid.
              </p>
              <p className="text-sm text-[#637488] text-center mb-4">Limite: massimo 20.000 caratteri (~6 pagine).</p>
              <div className="bg-[#e0e7ff]/50 border-l-4 border-[#0d78f2] text-sm text-[#637488] p-4 rounded-r-lg mb-8 mx-auto max-w-3xl">
                <p className="font-medium">Come iniziare:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Digita o incolla il tuo testo nell'area di testo qui sotto.</li>
                  <li>Oppure, clicca su "Carica da File" per usare un file .txt.</li>
                  <li>Premi "Genera Mermaid" per creare il diagramma.</li>
                  <li>Usa "Copia negli Appunti" o "Salva come TXT" per esportare il codice.</li>
                </ol>
              </div>
            </div>
            
            <div className="w-full max-w-3xl space-y-6 flex flex-col items-center">
              <div className="w-full">
                <label className="sr-only" htmlFor="text-input">Text Input</label>
                <textarea 
                  className="w-full min-h-[250px] resize-y p-4 text-base font-normal leading-relaxed text-[#111418] bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#e0e7ff] focus:border-[#0d78f2] placeholder-gray-400"
                  id="text-input" 
                  placeholder="Incolla o digita il tuo testo qui..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button className="flex items-center justify-center gap-2 rounded-md h-11 px-5 bg-gray-100 text-[#111418] text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-gray-200 transition-colors" title="Carica un file di testo (.txt) dal tuo computer.">
                  <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M240,136v64a16,16,0,0,1-16,16H32a16,16,0,0,1-16-16V136a16,16,0,0,1,16-16H80a8,8,0,0,1,0,16H32v64H224V136H176a8,8,0,0,1,0-16h48A16,16,0,0,1,240,136ZM85.66,77.66,120,43.31V128a8,8,0,0,0,16,0V43.31l34.34,34.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,77.66Z"></path>
                  </svg>
                  <span className="truncate">Carica da File</span>
                </button>
                <p className="text-sm text-[#637488]">Supported file type: .txt</p>
              </div>
              
              <div className="border-t border-gray-200 pt-6 w-full max-w-sm">
                <button 
                  onClick={handleGenerateMermaid}
                  disabled={isGenerating}
                  className={`w-full flex items-center justify-center gap-2 rounded-md h-12 px-6 text-base font-bold leading-normal tracking-wide shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isGenerating 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-[#0d78f2] text-white hover:bg-opacity-90 focus:ring-[#0d78f2]'
                  }`} 
                  title="Genera il codice Mermaid dal testo inserito."
                >
                  {isGenerating ? (
                    <>
                      <div className="relative w-6 h-6">
                        <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-1 border-2 border-white border-b-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                      </div>
                      <span>Elaborando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                      <span>Genera Mermaid</span>
                    </>
                  )}
                </button>
              </div>
              
              {isGenerating && (
                <div className="w-full max-w-md mx-auto">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-1 w-6 h-6 border-2 border-blue-300 border-b-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.2s'}}></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">Comunicazione con LLM in corso...</p>
                        <p className="text-xs text-blue-600">{processingStep}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-blue-700 bg-blue-100 rounded p-2">
                      <p className="font-medium mb-1">⏳ Non chiudere questa pagina</p>
                      <p>Il sistema sta elaborando le informazioni. Questo processo può richiedere alcuni secondi.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-6 flex flex-wrap gap-4 w-full">
                <button 
                  onClick={handleCopyToClipboard}
                  className="flex items-center justify-center gap-2 rounded-md h-11 px-5 bg-gray-100 text-[#111418] text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-gray-200 transition-colors flex-1" 
                  title="Copia il codice Mermaid generato negli appunti."
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                  <span>Copia negli Appunti</span>
                </button>
                <button 
                  onClick={handleSaveAsTxt}
                  className="flex items-center justify-center gap-2 rounded-md h-11 px-5 bg-gray-100 text-[#111418] text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-gray-200 transition-colors flex-1" 
                  title="Salva il codice Mermaid generato come file di testo (.txt)."
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                  <span>Salva come TXT</span>
                </button>
              </div>
            </div>
          </div>
        </main>
        
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 md:hidden">
          <div className="max-w-4xl mx-auto flex justify-center gap-4">
            <button 
              onClick={() => router.push('/disegno')}
              className="flex items-center justify-center gap-2 rounded-md h-11 px-5 bg-gray-100 text-[#111418] text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-gray-200 transition-colors flex-1" 
              title="Vai alla finestra di Disegno Diagrammi di Flusso"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span>Disegno</span>
            </button>
            <button 
              onClick={() => router.push('/output')}
              className="flex items-center justify-center gap-2 rounded-md h-11 px-5 bg-gray-100 text-[#111418] text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-gray-200 transition-colors flex-1" 
              title="Vai alla finestra di Output del Codice Mermaid"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span>Output</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay di caricamento a schermo intero */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-blue-100 border-b-blue-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                <div className="absolute inset-4 border-4 border-blue-50 border-r-blue-300 rounded-full animate-spin" style={{animationDuration: '2s'}}></div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Comunicazione con LLM in corso...
              </h3>
              
              <p className="text-gray-600 mb-4">
                {processingStep}
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="text-blue-500 mt-0.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">⏳ Non chiudere questa pagina</p>
                    <p>Il sistema sta elaborando le informazioni con l'AI. Questo processo può richiedere alcuni secondi.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
