"use client";

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
// Torniamo al canvas HTML5 nativo per semplicità e affidabilità

export default function Disegno() {
  const router = useRouter();
  const bgCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const cursorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [disableCache, setDisableCache] = useState(false);
  
  // Ridisegna lo sfondo (bianco + eventuale immagine) nel canvas di background
  const redrawBackground = () => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const bgCtx = bgCanvas.getContext('2d');
    // Dimensioni in CSS pixel (coordinate logiche dopo scale DPR)
    const rect = bgCanvas.getBoundingClientRect();
    const canvasWidth = Math.max(1, Math.floor(rect.width));
    const canvasHeight = Math.max(1, Math.floor(rect.height));
    // Pulisci con bianco (usando coordinate CSS, dato che il contesto è scalato con DPR)
    bgCtx.save();
    bgCtx.globalCompositeOperation = 'source-over';
    bgCtx.fillStyle = '#ffffff';
    bgCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    bgCtx.restore();

    if (uploadedImage?.dataUrl) {
      const img = new Image();
      img.onload = () => {
        const imgRatio = img.width / img.height;
        const canvasRatio = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;
        if (imgRatio > canvasRatio) {
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / imgRatio;
          offsetX = 0;
          offsetY = (canvasHeight - drawHeight) / 2;
        } else {
          drawHeight = canvasHeight;
          drawWidth = canvasHeight * imgRatio;
          offsetX = (canvasWidth - drawWidth) / 2;
          offsetY = 0;
        }
        bgCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      };
      img.src = uploadedImage.dataUrl;
    }
  };

  // Gestione dimensioni e scaling: massimizza entro il contenitore e supporta HiDPI
  useEffect(() => {
    const resizeCanvasesToContainer = () => {
      const container = canvasContainerRef.current;
      const bgCanvas = bgCanvasRef.current;
      const drawCanvas = drawCanvasRef.current;
      if (!container || !bgCanvas || !drawCanvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = Math.max(1, Math.floor(rect.width));
      const cssHeight = Math.max(1, Math.floor(rect.height));

      // Snapshot del layer di disegno prima del resize (per preservare il contenuto)
      let snapshot = null;
      if (drawCanvas.width > 0 && drawCanvas.height > 0) {
        snapshot = document.createElement('canvas');
        snapshot.width = drawCanvas.width;
        snapshot.height = drawCanvas.height;
        const sctx = snapshot.getContext('2d');
        sctx.drawImage(drawCanvas, 0, 0);
      }

      // Background canvas
      const bgCtx = bgCanvas.getContext('2d');
      bgCanvas.width = cssWidth * dpr;
      bgCanvas.height = cssHeight * dpr;
      bgCanvas.style.width = `${cssWidth}px`;
      bgCanvas.style.height = `${cssHeight}px`;
      bgCtx.setTransform(1, 0, 0, 1, 0, 0);
      bgCtx.scale(dpr, dpr);
      // Pulisci e ridisegna dopo l'aggiornamento dimensioni
      bgCtx.clearRect(0, 0, cssWidth, cssHeight);
      redrawBackground();

      // Drawing canvas (top layer)
      const drawCtx = drawCanvas.getContext('2d');
      drawCanvas.width = cssWidth * dpr;
      drawCanvas.height = cssHeight * dpr;
      drawCanvas.style.width = `${cssWidth}px`;
      drawCanvas.style.height = `${cssHeight}px`;
      drawCtx.setTransform(1, 0, 0, 1, 0, 0);
      drawCtx.scale(dpr, dpr);
      // Ripristina il contenuto precedente se disponibile, adattandolo alle nuove dimensioni CSS
      if (snapshot) {
        drawCtx.clearRect(0, 0, cssWidth, cssHeight);
        drawCtx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, cssWidth, cssHeight);
      }
    };

    resizeCanvasesToContainer();
    window.addEventListener('resize', resizeCanvasesToContainer);
    return () => window.removeEventListener('resize', resizeCanvasesToContainer);
  }, [uploadedImage]);

  // Input di disegno sul layer superiore con gomma non distruttiva
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let drawing = false;

    const showCursor = () => {
      if (cursorRef.current) {
        cursorRef.current.style.display = 'block';
      }
    };
    const hideCursor = () => {
      if (cursorRef.current) {
        cursorRef.current.style.display = 'none';
      }
    };
    const moveCursor = (x, y) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${x}px`;
        cursorRef.current.style.top = `${y}px`;
      }
    };

    const getPointer = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      // Il contesto è già scalato al DPR, quindi lavoriamo in coordinate CSS pixel
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const start = (x, y) => {
      drawing = true;
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
      moveCursor(x, y);
    };

    const move = (x, y) => {
      if (!drawing) return;
      ctx.lineTo(x, y);
      ctx.stroke();
      moveCursor(x, y);
    };

    const stop = () => {
      if (!drawing) return;
      drawing = false;
      setIsDrawing(false);
      ctx.beginPath();
      ctx.globalCompositeOperation = 'source-over';
    };

    const onMouseEnter = (e) => { const p = getPointer(e.clientX, e.clientY); moveCursor(p.x, p.y); showCursor(); };
    const onMouseDown = (e) => { const p = getPointer(e.clientX, e.clientY); start(p.x, p.y); showCursor(); };
    const onMouseMove = (e) => { const p = getPointer(e.clientX, e.clientY); if (drawing) { move(p.x, p.y); } else { moveCursor(p.x, p.y); } };
    const onMouseUp = () => stop();
    const onMouseLeave = () => { stop(); hideCursor(); };

    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseout', onMouseLeave);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const onTouchStart = (e) => { e.preventDefault(); const t = e.touches[0]; const p = getPointer(t.clientX, t.clientY); start(p.x, p.y); showCursor(); };
    const onTouchMove = (e) => { e.preventDefault(); const t = e.touches[0]; const p = getPointer(t.clientX, t.clientY); move(p.x, p.y); showCursor(); };
    const onTouchEnd = (e) => { e.preventDefault(); stop(); hideCursor(); };
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseout', onMouseLeave);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [brushSize, isEraser]);

  // Aggiorna dimensione/colore del cursore quando cambia il tool o la dimensione
  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;
    el.style.width = `${brushSize}px`;
    el.style.height = `${brushSize}px`;
    el.style.border = '2px solid ' + (isEraser ? '#ef4444' : '#0d78f2');
    el.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.6) inset';
  }, [brushSize, isEraser]);

  // Funzione per pulire completamente canvas e stato
  const clearAll = () => {
    // Pulisci sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('generated_mermaid_code');
      sessionStorage.removeItem('ocr_text');
      sessionStorage.removeItem('analysis_type');
      sessionStorage.removeItem('model_used');
    }

    // Pulisci canvas di disegno
    const drawCanvas = drawCanvasRef.current;
    if (drawCanvas) {
      const drawCtx = drawCanvas.getContext('2d');
      const rect = drawCanvas.getBoundingClientRect();
      const canvasWidth = Math.max(1, Math.floor(rect.width));
      const canvasHeight = Math.max(1, Math.floor(rect.height));
      drawCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    // Pulisci canvas di background (solo disegno, mantieni immagine se presente)
    const bgCanvas = bgCanvasRef.current;
    if (bgCanvas) {
      const bgCtx = bgCanvas.getContext('2d');
      const rect = bgCanvas.getBoundingClientRect();
      const canvasWidth = Math.max(1, Math.floor(rect.width));
      const canvasHeight = Math.max(1, Math.floor(rect.height));
      
      // Ridisegna solo lo sfondo bianco + immagine (se presente)
      redrawBackground();
    }

    // Pulisci stato
    setUploadedImage(null);
    setIsProcessing(false);
    setProcessingStep('');

    // Pulisci file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    console.log('Pulizia completa eseguita');
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validazione file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Formato file non supportato. Usa JPG, PNG o GIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('File troppo grande. Massimo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const newImage = {
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
      };
      setUploadedImage(newImage);
      
      // Ridisegna lo sfondo con la nuova immagine
      const bgCanvas = bgCanvasRef.current;
      if (bgCanvas) {
        const bgCtx = bgCanvas.getContext('2d');
        const rect = bgCanvas.getBoundingClientRect();
        const canvasWidth = Math.max(1, Math.floor(rect.width));
        const canvasHeight = Math.max(1, Math.floor(rect.height));
        
        // Pulisci con bianco
        bgCtx.save();
        bgCtx.globalCompositeOperation = 'source-over';
        bgCtx.fillStyle = '#ffffff';
        bgCtx.fillRect(0, 0, canvasWidth, canvasHeight);
        bgCtx.restore();

        // Carica e disegna la nuova immagine
        const img = new Image();
        img.onload = () => {
          const imgRatio = img.width / img.height;
          const canvasRatio = canvasWidth / canvasHeight;

          let drawWidth, drawHeight, offsetX, offsetY;
          if (imgRatio > canvasRatio) {
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
          } else {
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imgRatio;
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
          }
          bgCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateMermaid = async () => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!bgCanvas || !drawCanvas) {
      alert('Errore: Canvas non disponibile. Ricarica la pagina.');
      return;
    }

    // Controlla se c'è un'API key
    const apiKey = typeof window !== 'undefined' ? sessionStorage.getItem('openai_api_key') : '';
    if (!apiKey) {
      alert('Inserisci prima la tua OpenAI API Key nelle Impostazioni API.');
      return;
    }
    
    // Verifica che ci sia qualcosa da analizzare
    if (!uploadedImage) {
      // Se non c'è un'immagine caricata, verifica che ci sia del disegno
      const drawCtx = drawCanvas.getContext('2d');
      const imageData = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
      const hasContent = imageData.data.some(pixel => pixel !== 0);
      
      if (!hasContent) {
        alert('Disegna qualcosa o carica un\'immagine prima di generare il codice Mermaid.');
        return;
      }
    } else {
      // Se c'è un'immagine caricata, verifica che sia visibile
      if (!uploadedImage.dataUrl) {
        alert('Errore: Immagine non caricata correttamente. Riprova.');
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStep('Preparazione immagine...');

    try {
      // Se c'è un'immagine caricata, assicurati che sia stata disegnata completamente
      if (uploadedImage) {
        // Aspetta un momento per assicurarsi che l'immagine sia stata disegnata
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Componi i due layer in un canvas temporaneo
      const composite = document.createElement('canvas');
      composite.width = bgCanvas.width;
      composite.height = bgCanvas.height;
      const cctx = composite.getContext('2d');
      cctx.drawImage(bgCanvas, 0, 0);
      cctx.drawImage(drawCanvas, 0, 0);
      
      // Ridimensiona l'immagine se è troppo grande per Vercel
      const maxSize = 1024; // Dimensione massima per lato
      let finalCanvas = composite;
      
      if (composite.width > maxSize || composite.height > maxSize) {
        const scale = Math.min(maxSize / composite.width, maxSize / composite.height);
        const resizedCanvas = document.createElement('canvas');
        resizedCanvas.width = Math.floor(composite.width * scale);
        resizedCanvas.height = Math.floor(composite.height * scale);
        const rctx = resizedCanvas.getContext('2d');
        rctx.drawImage(composite, 0, 0, resizedCanvas.width, resizedCanvas.height);
        finalCanvas = resizedCanvas;
        console.log(`Immagine ridimensionata da ${composite.width}x${composite.height} a ${resizedCanvas.width}x${resizedCanvas.height}`);
      }
      
      let imageData = finalCanvas.toDataURL('image/png', 0.8).split(',')[1];
      
      // Controlla la dimensione del payload (limite Vercel: ~4.5MB)
      const payloadSize = new Blob([imageData]).size;
      const maxPayloadSize = 4 * 1024 * 1024; // 4MB per sicurezza
      
      if (payloadSize > maxPayloadSize) {
        console.warn(`Payload troppo grande (${Math.round(payloadSize / 1024 / 1024)}MB), ridimensionando ulteriormente...`);
        // Ridimensiona ulteriormente
        const furtherScale = Math.sqrt(maxPayloadSize / payloadSize);
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = Math.floor(finalCanvas.width * furtherScale);
        smallCanvas.height = Math.floor(finalCanvas.height * furtherScale);
        const sctx = smallCanvas.getContext('2d');
        sctx.drawImage(finalCanvas, 0, 0, smallCanvas.width, smallCanvas.height);
        imageData = smallCanvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        console.log(`Immagine ulteriormente compressa a ${smallCanvas.width}x${smallCanvas.height}`);
      }
      
      console.log(`Dimensione payload: ${Math.round(new Blob([imageData]).size / 1024 / 1024 * 100) / 100}MB`);
      
      setProcessingStep('Analisi OCR e visiva...');

      // Chiama l'API OCR
      const response = await fetch('/api/ocr-to-mermaid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(disableCache && { 'x-disable-cache': 'true' })
        },
        body: JSON.stringify({
          apiKey,
          imageData,
          imageType: uploadedImage ? 'photo' : 'drawing'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'elaborazione');
      }

      setProcessingStep('Salvataggio risultati...');

      // Salva il risultato in sessionStorage
      if (typeof window !== 'undefined') {
        const mermaidCode = data.mermaid || '';
        const model = data.model || '';
        const ocrText = data.ocrText || '';
        const analysisType = data.analysisType || '';
        
        // Verifica che il codice Mermaid sia valido
        if (!mermaidCode || !mermaidCode.trim()) {
          throw new Error('Nessun codice Mermaid generato dall\'API');
        }
        
        sessionStorage.setItem('generated_mermaid_code', mermaidCode);
        sessionStorage.setItem('used_model', model);
        sessionStorage.setItem('ocr_text', ocrText);
        sessionStorage.setItem('analysis_type', analysisType);
        
        // Verifica che i dati siano stati salvati correttamente
        const savedCode = sessionStorage.getItem('generated_mermaid_code');
        if (!savedCode || savedCode !== mermaidCode) {
          throw new Error('Errore nel salvataggio dei dati in sessionStorage');
        }
      }

      setProcessingStep('Completato!');
      
      // Naviga alla pagina output (i controlli sono già stati fatti sopra)
      router.push('/output');
      
    } catch (error) {
      console.error('Errore durante la generazione:', error);
      alert(`Errore: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleClearCanvas = () => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!bgCanvas || !drawCanvas) return;
    const bgCtx = bgCanvas.getContext('2d');
    const drawCtx = drawCanvas.getContext('2d');
    // Pulisci entrambi i layer
    bgCtx.save();
    bgCtx.globalCompositeOperation = 'source-over';
    bgCtx.fillStyle = '#ffffff';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.restore();
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    setUploadedImage(null);
  };

  const handleRemoveImage = () => {
    handleClearCanvas();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Funzione per completare il tratto corrente se necessario (non più necessaria con Fabric.js)
  const completeCurrentStroke = () => {
    // Fabric.js gestisce automaticamente i tratti
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
              onClick={() => router.push('/input-testo')}
              className="text-sm font-medium text-[#637488] hover:text-[#0d78f2] transition-colors"
            >
              Input Testo
            </button>
            <button 
              onClick={() => router.push('/output')}
              className="text-sm font-medium text-[#637488] hover:text-[#0d78f2] transition-colors"
            >
              Output
            </button>
            <button 
              onClick={() => router.push('/')}
              className="flex min-w-[100px] sm:min-w-[120px] items-center justify-center rounded-md h-9 sm:h-10 px-3 sm:px-4 text-sm font-bold leading-normal tracking-wide shadow-md transition-all bg-[#0d78f2] text-white hover:bg-opacity-90"
            >
              <span className="truncate">Home</span>
            </button>
          </nav>
        </header>
        
        {/* Menu mobile per navigazione */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/input-testo')}
              className="flex items-center justify-center gap-2 rounded-md h-10 px-3 bg-gray-100 text-[#111418] text-sm font-medium hover:bg-gray-200 transition-colors flex-1 mx-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span className="text-xs">Testo</span>
            </button>
            <button 
              onClick={() => router.push('/output')}
              className="flex items-center justify-center gap-2 rounded-md h-10 px-3 bg-gray-100 text-[#111418] text-sm font-medium hover:bg-gray-200 transition-colors flex-1 mx-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              <span className="text-xs">Output</span>
            </button>
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
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Strumenti</h2>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 rounded-lg bg-[#f0f2f5] p-3 sm:p-4">
                      <button 
                        onClick={() => {
                          completeCurrentStroke();
                          setIsEraser(false);
                        }}
                        className={`relative group flex flex-col items-center justify-center gap-2 rounded-md p-4 sm:p-3 transition-colors min-h-[80px] sm:min-h-0 ${
                          !isEraser 
                            ? 'text-[#0d78f2] bg-[#e0e7ff] ring-2 ring-[#0d78f2]' 
                            : 'text-[#4b5563] hover:bg-gray-200'
                        }`} 
                        title="Disegna liberamente sul canvas."
                      >
                        <svg className="size-8 sm:size-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                        <span className="text-sm sm:text-xs font-medium">Penna</span>
                      </button>
                      <button 
                        onClick={() => {
                          completeCurrentStroke();
                          setIsEraser(true);
                        }}
                        className={`relative group flex flex-col items-center justify-center gap-2 rounded-md p-4 sm:p-3 transition-colors min-h-[80px] sm:min-h-0 ${
                          isEraser 
                            ? 'text-[#0d78f2] bg-[#e0e7ff] ring-2 ring-[#0d78f2]' 
                            : 'text-[#4b5563] hover:bg-gray-200'
                        }`} 
                        title="Cancella parti del disegno."
                      >
                        <svg className="size-8 sm:size-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21H7Z"></path>
                          <path d="M22 21H7"></path>
                        </svg>
                        <span className="text-sm sm:text-xs font-medium">Gomma</span>
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-[#637488] mb-3 font-semibold">Dimensione Tratto</h3>
                    <input 
                      className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                      max="20" 
                      min="1" 
                      type="range" 
                      value={brushSize}
                      onChange={(e) => {
                        completeCurrentStroke();
                        setBrushSize(parseInt(e.target.value));
                      }}
                    />
                    <div className="flex justify-between text-xs text-[#637488] mt-2">
                      <span>1px</span>
                      <span className="font-medium">{brushSize}px</span>
                      <span>20px</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-[#637488] mb-3 font-semibold">Pulizia</h3>
                    <div className="space-y-2">
                      <button 
                        onClick={clearAll}
                        className="w-full flex items-center justify-center gap-2 rounded-md h-10 px-4 text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        title="Pulisci tutto: canvas, cache e stato"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Pulisci Tutto
                      </button>
                      <button 
                        onClick={() => {
                          // Pulisci solo la cache del server
                          fetch('/api/clear-cache', { method: 'POST' })
                            .then(response => response.json())
                            .then(data => {
                              console.log('Cache server pulita:', data);
                              alert(`Cache server pulita: ${data.clearedItems} elementi rimossi`);
                            })
                            .catch(error => {
                              console.error('Errore pulizia cache:', error);
                              alert('Errore durante la pulizia della cache');
                            });
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-md h-10 px-4 text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                        title="Pulisci solo la cache del server"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Pulisci Cache Server
                      </button>
                    </div>
                  </div>

                  {/* Sezione Debug temporaneamente nascosta
                  <div>
                    <h3 className="text-sm font-medium text-[#637488] mb-3 font-semibold">Debug</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={disableCache}
                          onChange={(e) => setDisableCache(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Disabilita Cache</span>
                      </label>
                      <p className="text-xs text-gray-500">
                        {disableCache ? 'Cache disabilitata - ogni richiesta è nuova' : 'Cache abilitata - risultati salvati'}
                      </p>
                    </div>
                  </div>
                  */}
                  
                  <div className="border-t border-[#d1d5db] pt-6">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Immagini</h2>
                    <div className="mt-4 space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative group w-full flex items-center justify-center gap-2 rounded-md h-12 sm:h-11 px-4 sm:px-5 bg-gray-100 text-[#111418] text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-gray-200 transition-colors" 
                        title="Carica un'immagine da usare come riferimento."
                      >
                        <svg className="size-6 sm:size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <rect height="18" rx="2" ry="2" width="18" x="3" y="3"></rect>
                          <circle cx="9" cy="9" r="2"></circle>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                        </svg>
                        <span>Carica Immagine</span>
                      </button>
                      
                      {uploadedImage && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-green-800 truncate">
                                {uploadedImage.name}
                              </p>
                              <p className="text-xs text-green-600">
                                {(uploadedImage.size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                            <button
                              onClick={handleRemoveImage}
                              className="ml-2 text-red-500 hover:text-red-700"
                              title="Rimuovi immagine"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-center text-[#637488]">PNG, JPG fino a 5MB</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-[#d1d5db] pt-6">
                    <button 
                      onClick={handleClearCanvas}
                      className="w-full flex items-center justify-center gap-2 rounded-md h-12 sm:h-11 px-4 sm:px-5 bg-red-100 text-red-700 text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-red-200 transition-colors"
                    >
                      <svg className="size-6 sm:size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                      <span>Pulisci Canvas</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-9 order-1 lg:order-2">
                <div ref={canvasContainerRef} className="relative w-full bg-[#ffffff] border border-dashed border-[#d1d5db] rounded-lg shadow-inner flex items-center justify-center overflow-hidden group" style={{ height: 'calc(100vh - 260px)' }}>
                  <canvas
                    ref={bgCanvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                  />
                  <canvas
                    ref={drawCanvasRef}
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                  />
                  {/* Cursore visuale dimensione pennello/gomma */}
                  <div
                    ref={cursorRef}
                    className="pointer-events-none absolute rounded-full z-10"
                    style={{
                      display: 'none',
                      left: 0,
                      top: 0,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'transparent',
                    }}
                  />
                  {!isDrawing && !uploadedImage && (
                    <div className="text-center text-[#637488] pointer-events-none">
                      <svg className="mx-auto size-12 text-gray-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 20v-6m0-4V4m6 8h-6m-4 0H4"></path>
                        <path d="M12 20v-6m0-4V4m6 8h-6m-4 0H4"></path>
                        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-[#111418]">Canvas di Disegno</h3>
                      <p className="mt-1 text-sm">Disegna il tuo diagramma o carica un'immagine per l'analisi OCR.</p>
                    </div>
                  )}
                </div>
                
                {isProcessing && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-1 w-4 h-4 border-2 border-blue-300 border-b-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.2s'}}></div>
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
                )}
                
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={handleGenerateMermaid}
                    disabled={isProcessing}
                    className={`relative group inline-flex items-center justify-center rounded-lg h-12 px-8 text-base font-bold leading-normal tracking-wide shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all transform ${
                      isProcessing 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-[#0d78f2] text-white hover:bg-opacity-90 focus:ring-[#0d78f2] hover:scale-105'
                    }`} 
                    title="Analizza il disegno/immagine e genera il codice Mermaid corrispondente."
                  >
                    <svg className="mr-3 size-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" x2="8" y1="13" y2="13"></line>
                      <line x1="16" x2="8" y1="17" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span>{uploadedImage ? 'Analizza Immagine' : 'Genera Mermaid'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Overlay di caricamento a schermo intero */}
      {isProcessing && (
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
