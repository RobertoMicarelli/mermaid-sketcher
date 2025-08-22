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
  const [showEditor, setShowEditor] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [isFixing, setIsFixing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

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
    
    // Aggiungi la funzione globale per gestire il click dal preview
    window.handleFixSyntaxFromPreview = handleFixSyntax;
    
    // Cleanup
    return () => {
      delete window.handleFixSyntaxFromPreview;
    };
  }, []);



  // Inizializza l'editedCode quando il mermaidCode cambia
  useEffect(() => {
    if (mermaidCode && !editedCode) {
      setEditedCode(mermaidCode);
    }
  }, [mermaidCode, editedCode]);

  // Renderizza la preview quando l'editedCode cambia
  useEffect(() => {
    if (showEditor && editedCode && mermaidLoaded) {
      // Debounce per evitare troppi rendering
      const timeoutId = setTimeout(() => {
        renderEditorPreview(editedCode);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [editedCode, showEditor, mermaidLoaded]);

  // Funzione per renderizzare la preview nell'editor
  const renderEditorPreview = async (code) => {
    if (!code || !mermaidLoaded) return;

    try {
      const element = document.getElementById('editor-mermaid-preview');
      if (element) {
        element.innerHTML = '';
        const { svg } = await window.mermaid.render('editor-preview', code);
        element.innerHTML = svg;
      }
    } catch (error) {
      console.error('Errore rendering preview editor:', error);
      const element = document.getElementById('editor-mermaid-preview');
      if (element) {
        element.innerHTML = `
          <div class="text-center text-red-500 p-4">
            <svg class="mx-auto h-8 w-8 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <p class="text-sm">Errore nella sintassi Mermaid</p>
            <button 
              onclick="window.handleFixSyntaxFromPreview()"
              class="mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium flex items-center mx-auto"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Correggi Automaticamente
            </button>
          </div>
        `;
      }
      // Mostra il modal di correzione
      setShowErrorModal(true);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(mermaidCode);
  };

  const handleFixSyntax = async () => {
    setIsFixing(true);
    
    try {
      const apiKey = typeof window !== 'undefined' ? sessionStorage.getItem('openai_api_key') : '';
      if (!apiKey) {
        alert('API Key non trovata. Imposta la OpenAI API Key nelle Impostazioni API.');
        setIsFixing(false);
        return;
      }

      const response = await fetch('/api/fix-mermaid-syntax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          mermaidCode: editedCode,
          apiKey: apiKey
        })
      });

      if (!response.ok) {
        throw new Error('Errore nella correzione');
      }

      const data = await response.json();
      
      if (data.success && data.correctedMermaid) {
        setEditedCode(data.correctedMermaid);
        setMermaidCode(data.correctedMermaid);
        setShowErrorModal(false);
        // Re-renderizza la preview con il codice corretto
        setTimeout(() => {
          renderEditorPreview(data.correctedMermaid);
        }, 100);
      } else {
        throw new Error('Impossibile correggere il codice');
      }
    } catch (err) {
      console.error('Error fixing syntax:', err);
      alert('Errore durante la correzione automatica: ' + err.message);
    } finally {
      setIsFixing(false);
    }
  };

  const downloadAsImage = async (format = 'png') => {
    if (!editedCode || editedCode.startsWith('//')) {
      alert('Nessun diagramma da scaricare');
      return;
    }

    try {
      // Renderizza il diagramma per ottenere l'SVG
      const { svg } = await window.mermaid.render('download-diagram', editedCode);
      
      // Crea un elemento temporaneo per l'SVG
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = svg;
      const svgElement = tempDiv.querySelector('svg');
      
      if (!svgElement) {
        throw new Error('SVG non generato');
      }

      // Aggiungi l'elemento al DOM temporaneamente (nascosto)
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);

      // Usa html2canvas per convertire l'elemento in canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 2, // 2x per migliore qualità
        useCORS: true,
        allowTaint: true,
        width: svgElement.viewBox?.baseVal?.width || 800,
        height: svgElement.viewBox?.baseVal?.height || 600
      });

      // Rimuovi l'elemento temporaneo
      document.body.removeChild(tempDiv);

      // Converti il canvas in blob e scarica
      canvas.toBlob((blob) => {
        if (blob) {
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `mermaid-diagram.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
        } else {
          throw new Error('Impossibile generare il file');
        }
      }, `image/${format}`);

    } catch (err) {
      console.error('Download error:', err);
      alert('Errore durante il download: ' + err.message);
    }
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
                      onClick={() => downloadAsImage('png')}
                      className="relative group w-full flex items-center justify-center gap-2 rounded-md h-12 sm:h-11 px-4 sm:px-5 bg-green-100 text-green-700 text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-green-200 transition-colors" 
                      title="Scarica il diagramma come immagine PNG."
                    >
                      <svg className="size-6 sm:size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <span>Scarica PNG</span>
                    </button>
                      <button 
                        onClick={() => setShowEditor(true)}
                        className="relative group w-full flex items-center justify-center gap-2 rounded-md h-12 sm:h-11 px-4 sm:px-5 bg-blue-100 text-blue-700 text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-blue-200 transition-colors" 
                        title="Guarda il grafico ottenuto e modifica se necessario il testo o il layout."
                      >
                        <svg className="size-6 sm:size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Editor + Preview</span>
                      </button>
                      <p className="text-xs text-gray-600 text-center mt-2">
                        Guarda il grafico ottenuto e modifica se necessario il testo o il layout
                      </p>
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
                      onClick={() => {
                        setEditedCode(mermaidCode);
                        setTimeout(() => renderEditorPreview(mermaidCode), 100);
                      }}
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
                    <button 
                      onClick={() => downloadAsImage('png')}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      PNG
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

      {/* Modal per correzione errori di sintassi */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <h3 className="text-lg font-semibold text-gray-800">
                Errore di Sintassi Mermaid
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Il codice Mermaid contiene errori di sintassi. Vuoi che tenti una correzione automatica tramite AI?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleFixSyntax}
                disabled={isFixing}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center"
              >
                {isFixing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Correggendo...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Correggi
                  </>
                )}
              </button>
              <button
                onClick={() => setShowErrorModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
