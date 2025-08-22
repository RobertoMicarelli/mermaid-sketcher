"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Output() {
  const router = useRouter();
  const [mermaidCode, setMermaidCode] = useState('');
  const [usedModel, setUsedModel] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [analysisType, setAnalysisType] = useState('');
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const [mermaidError, setMermaidError] = useState('');
  const [diagramRendered, setDiagramRendered] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editedCode, setEditedCode] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const code = sessionStorage.getItem('generated_mermaid_code') || '';
      const model = sessionStorage.getItem('used_model') || '';
      const ocr = sessionStorage.getItem('ocr_text') || '';
      const type = sessionStorage.getItem('analysis_type') || '';
      
      // Se non ci sono dati, reindirizza alla home
      if (!code || !code.trim()) {
        alert('Nessun codice Mermaid trovato. Torna alla pagina di disegno per generare un nuovo diagramma.');
        router.push('/disegno');
        return;
      }
      
      setMermaidCode(code);
      setUsedModel(model);
      setOcrText(ocr);
      setAnalysisType(type);
      
      // Pulisci la cache solo dopo aver verificato che i dati esistono
      setTimeout(() => {
        sessionStorage.removeItem('generated_mermaid_code');
        sessionStorage.removeItem('used_model');
        sessionStorage.removeItem('ocr_text');
        sessionStorage.removeItem('analysis_type');
      }, 100);
    }
  }, [router]);

  // Carica Mermaid quando il componente si monta
  useEffect(() => {
    loadMermaid();
  }, []);

  // Renderizza il diagramma quando Mermaid è caricato e il codice è disponibile
  useEffect(() => {
    if (mermaidLoaded && mermaidCode && !diagramRendered) {
      console.log('🎯 useEffect: Pronto per rendering');
      // Aggiungi un piccolo delay per assicurarsi che il DOM sia pronto
      setTimeout(() => {
        renderMermaidDiagram();
      }, 100);
    }
  }, [mermaidLoaded, mermaidCode, diagramRendered]);

  // Inizializza l'editedCode quando il mermaidCode cambia
  useEffect(() => {
    if (mermaidCode && !editedCode) {
      setEditedCode(mermaidCode);
    }
  }, [mermaidCode, editedCode]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(mermaidCode);
  };

  const handleSaveAsTxt = () => {
    const blob = new Blob([mermaidCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mermaid-diagram.mmd';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Funzione per caricare Mermaid.js dinamicamente
  const loadMermaid = async () => {
    try {
      console.log('🔄 Iniziando caricamento Mermaid...');
      
      if (window.mermaid) {
        console.log('✅ Mermaid già caricato');
        setMermaidLoaded(true);
        return;
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.10.0/dist/mermaid.min.js';
        
        script.onload = () => {
          console.log('📦 Script Mermaid caricato');
          if (window.mermaid) {
            console.log('⚙️ Inizializzando Mermaid...');
            window.mermaid.initialize({
              startOnLoad: false,
              theme: 'default',
              flowchart: {
                useMaxWidth: true,
                htmlLabels: true
              }
            });
            console.log('✅ Mermaid inizializzato con successo');
            setMermaidLoaded(true);
            resolve();
          } else {
            console.error('❌ Mermaid non disponibile dopo caricamento');
            reject(new Error('Mermaid non caricato correttamente'));
          }
        };
        
        script.onerror = (error) => {
          console.error('❌ Errore caricamento script Mermaid:', error);
          reject(new Error('Errore caricamento Mermaid'));
        };
        
        document.head.appendChild(script);
        console.log('📎 Script Mermaid aggiunto al DOM');
      });
    } catch (error) {
      console.error('❌ Errore caricamento Mermaid:', error);
      setMermaidError('Impossibile caricare la visualizzazione del diagramma');
    }
  };

  // Funzione per renderizzare il diagramma
  const renderMermaidDiagram = async () => {
    console.log('🎨 Iniziando rendering diagramma...');
    console.log('📝 Codice Mermaid:', mermaidCode);
    console.log('✅ Mermaid caricato:', mermaidLoaded);
    console.log('🎯 Diagramma già renderizzato:', diagramRendered);
    
    if (!mermaidCode || !mermaidLoaded) {
      console.log('❌ Prerequisiti non soddisfatti');
      return;
    }

    // Evita rendering duplicati
    if (diagramRendered) {
      console.log('✅ Diagramma già renderizzato, skip');
      return;
    }

    try {
      setMermaidError('');
      
      // Aspetta che l'elemento sia disponibile nel DOM
      let element = document.getElementById('mermaid-diagram');
      let attempts = 0;
      
      while (!element && attempts < 10) {
        console.log(`🔍 Tentativo ${attempts + 1} di trovare l'elemento container...`);
        await new Promise(resolve => setTimeout(resolve, 50));
        element = document.getElementById('mermaid-diagram');
        attempts++;
      }
      
      console.log('🔍 Elemento container:', element);
      
      if (element) {
        element.innerHTML = '';
        console.log('🔄 Rendering diagramma...');
        const { svg } = await window.mermaid.render('mermaid-diagram', mermaidCode);
        console.log('✅ SVG generato:', svg.substring(0, 100) + '...');
        element.innerHTML = svg;
        setDiagramRendered(true);
        console.log('✅ Diagramma renderizzato con successo');
      } else {
        console.error('❌ Elemento container non trovato dopo tutti i tentativi');
        setMermaidError('Container diagramma non disponibile');
      }
    } catch (error) {
      console.error('❌ Errore rendering Mermaid:', error);
      setMermaidError(`Errore nella visualizzazione del diagramma: ${error.message}`);
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#d1d5db] px-4 sm:px-10 py-4 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4 text-[#111418]">
            <img src="/loghi/logo192.png" alt="Logo" className="h-6 w-6 sm:h-7 sm:w-7" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Mermaid Code Generator (By Roberto Micarelli)</h1>
          </div>
          <nav className="hidden md:flex items-center gap-4 sm:gap-8">
            <button 
              onClick={() => router.push('/')}
              className="flex min-w-[100px] sm:min-w-[120px] items-center justify-center rounded-md h-9 sm:h-10 px-3 sm:px-4 bg-[#0d78f2] text-white text-sm font-bold leading-normal tracking-wide shadow-md hover:bg-opacity-90 transition-all"
            >
              <span className="truncate">Home</span>
            </button>
          </nav>
        </header>
        
        {/* Menu mobile semplificato */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 rounded-md h-10 px-3 bg-[#0d78f2] text-white text-sm font-medium hover:bg-opacity-90 transition-colors flex-1 mx-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              <span className="text-xs">Home</span>
            </button>
          </div>
        </div>
        
        <main className="flex-1 px-4 sm:px-10 py-6 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
              <div className="lg:col-span-3 order-2 lg:order-1">
                <div className="space-y-6">
                  <div className="border-t border-[#d1d5db] pt-6">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Codice Generato</h2>
                    <div className="mt-4 flex flex-col gap-3">
                      <button 
                        onClick={handleCopyToClipboard}
                        className="relative group w-full flex items-center justify-center gap-2 rounded-md h-12 sm:h-11 px-4 sm:px-5 bg-gray-100 text-[#111418] text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-gray-200 transition-colors" 
                        title="Copia il codice Mermaid negli appunti."
                      >
                        <svg className="size-6 sm:size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <rect height="14" rx="2" ry="2" width="14" x="8" y="8"></rect>
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                        </svg>
                        <span>Copia negli Appunti</span>
                      </button>
                      <button 
                        onClick={handleSaveAsTxt}
                        className="relative group w-full flex items-center justify-center gap-2 rounded-md h-12 sm:h-11 px-4 sm:px-5 bg-gray-100 text-[#111418] text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-gray-200 transition-colors" 
                        title="Salva il codice Mermaid come file di testo."
                      >
                        <svg className="size-6 sm:size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" x2="12" y1="15" y2="3"></line>
                        </svg>
                        <span>Salva come TXT</span>
                      </button>
                      <button 
                        onClick={() => setShowEditor(true)}
                        className="relative group w-full flex items-center justify-center gap-2 rounded-md h-12 sm:h-11 px-4 sm:px-5 bg-blue-100 text-blue-700 text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-blue-200 transition-colors" 
                        title="Apri editor per modificare e visualizzare il diagramma."
                      >
                        <svg className="size-6 sm:size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Editor + Preview</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-9 order-1 lg:order-2">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#111418]">Codice Mermaid Generato</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      {usedModel && (
                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          Modello OpenAI: {usedModel}
                        </span>
                      )}
                      {analysisType && (
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          analysisType === 'combined' 
                            ? 'text-blue-700 bg-blue-100' 
                            : 'text-green-700 bg-green-100'
                        }`}>
                          {analysisType === 'combined' ? 'OCR + Visiva' : 'Analisi Visiva'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap overflow-x-auto">
                      {mermaidCode}
                    </pre>
                  </div>
                  
                  {ocrText && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Testo Estratto con OCR</h3>
                      <div className="bg-white border border-yellow-200 rounded p-3">
                        <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
                          {ocrText}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Anteprima del Diagramma</h3>
                    <div className="bg-white border border-gray-200 rounded p-4">
                      {!mermaidLoaded && !mermaidError && (
                        <div className="text-center text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          <p>Caricamento visualizzazione...</p>
                        </div>
                      )}
                      
                      {mermaidError && (
                        <div className="text-center text-red-500">
                          <svg className="mx-auto h-12 w-12 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                          </svg>
                          <p className="text-sm">{mermaidError}</p>
                          <p className="text-xs text-gray-500 mt-1">Il codice Mermaid è comunque valido e può essere copiato</p>
                        </div>
                      )}
                      
                      {mermaidLoaded && !mermaidError && (
                        <div>
                          <div id="mermaid-diagram" className="flex justify-center overflow-x-auto mb-4">
                            {/* Il diagramma Mermaid verrà renderizzato qui */}
                          </div>
                          <button 
                            onClick={() => {
                              setDiagramRendered(false);
                              setTimeout(() => renderMermaidDiagram(), 100);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            🔄 Forza Rendering
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Note dall'Elaborazione</h3>
                    <div className="bg-white border border-green-200 rounded p-3">
                      <p className="text-sm text-gray-700">
                        Il codice Mermaid è stato generato utilizzando un sistema di analisi avanzato che combina:
                      </p>
                      <ul className="text-sm text-gray-700 mt-2 space-y-1">
                        <li>• <strong>Analisi visiva</strong>: Identificazione di forme geometriche, connessioni e flusso</li>
                        <li>• <strong>OCR intelligente</strong>: Estrazione e interpretazione del testo scritto a mano</li>
                        <li>• <strong>Validazione sintassi</strong>: Controlli per garantire compatibilità con MermaidChart</li>
                        <li>• <strong>Ottimizzazione colori</strong>: Applicazione di colori semantici per migliorare la leggibilità</li>
                      </ul>
                      {analysisType === 'combined' && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          Questo diagramma è stato creato combinando l'analisi OCR del testo con l'interpretazione visiva della struttura.
                        </p>
                      )}
                      {analysisType === 'visual' && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          Questo diagramma è stato creato attraverso l'analisi visiva pura della struttura del disegno.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Editor + Preview */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Editor Mermaid + Preview</h2>
              <button 
                onClick={() => setShowEditor(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Editor Panel */}
              <div className="w-full lg:w-1/2 p-4 border-r">
                <div className="h-full flex flex-col">
                  <h3 className="text-lg font-semibold mb-3">Codice Mermaid</h3>
                  <textarea
                    value={editedCode}
                    onChange={(e) => setEditedCode(e.target.value)}
                    className="flex-1 p-4 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Modifica il codice Mermaid qui..."
                  />
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => setEditedCode(mermaidCode)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => navigator.clipboard.writeText(editedCode)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                    >
                      Copia
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Preview Panel */}
              <div className="w-full lg:w-1/2 p-4">
                <div className="h-full flex flex-col">
                  <h3 className="text-lg font-semibold mb-3">Anteprima Diagramma</h3>
                  <div className="flex-1 bg-gray-50 border rounded-lg p-4 overflow-auto">
                    {editedCode ? (
                      <div id="editor-mermaid-preview" className="flex justify-center">
                        {/* Il diagramma verrà renderizzato qui */}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 mt-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p>Inserisci codice Mermaid per vedere l'anteprima</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
