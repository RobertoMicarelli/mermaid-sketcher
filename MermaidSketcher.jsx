"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  PencilLine, 
  Code2, 
  RefreshCw, 
  Upload, 
  Eraser, 
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Palette,
  FileText,
  Image as ImageIcon,
  Zap,
  Brain,
  Eye,
  Settings
} from 'lucide-react';

export default function MermaidSketcher() {
  const [canvasText, setCanvasText] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#3b82f6');
  const [activeTab, setActiveTab] = useState('text');
  const [showPreview, setShowPreview] = useState(false);

  // Esempi predefiniti migliorati
  const examples = [
    {
      name: "Processo di Login",
      icon: "🔐",
      text: "Utente inserisce credenziali → Sistema verifica → Se valide → Accesso consentito → Se non valide → Mostra errore"
    },
    {
      name: "E-commerce Flow",
      icon: "🛒",
      text: "Utente sfoglia prodotti → Aggiunge al carrello → Procede al checkout → Inserisce dati → Conferma ordine → Riceve email"
    },
    {
      name: "Sistema di Supporto",
      icon: "🎫",
      text: "Cliente apre ticket → Sistema assegna priorità → Team analizza → Se risolvibile → Chiude ticket → Se complesso → Escalation"
    },
    {
      name: "Workflow di Sviluppo",
      icon: "💻",
      text: "Developer scrive codice → Push su Git → CI/CD pipeline → Test automatici → Se passano → Deploy → Se falliscono → Fix"
    }
  ];

  const handleConvert = async () => {
    if (!canvasText.trim()) {
      setError('❌ Inserisci del testo da convertire prima di generare il diagramma');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Invio richiesta per convertire:', canvasText.substring(0, 100) + '...');
      
      const response = await fetch('/api/convert-to-mermaid', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ input: canvasText })
      });
      
      console.log('Risposta ricevuta, status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore HTTP:', response.status, errorText);
        throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Dati ricevuti:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.mermaid) {
        throw new Error('Nessun codice Mermaid generato');
      }
      
      setMermaidCode(data.mermaid);
      setSuccess('🎉 Diagramma Mermaid generato con successo!');
      setShowPreview(true);
    } catch (error) {
      console.error('Conversion error:', error);
      setError('❌ Errore nella conversione: ' + error.message);
      setMermaidCode('// Errore nella conversione: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertFromCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('❌ Canvas non disponibile');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Generazione immagine dal canvas...');
      const imageData = canvas.toDataURL('image/png');
      console.log('Immagine generata, dimensione:', imageData.length);
      
      const response = await fetch('/api/ocr-to-mermaid', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ image: imageData })
      });
      
      console.log('Risposta OCR ricevuta, status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore OCR HTTP:', response.status, errorText);
        throw new Error(`Errore OCR HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Dati OCR ricevuti:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.mermaid) {
        throw new Error('Nessun codice Mermaid generato dall\'OCR');
      }
      
      setMermaidCode(data.mermaid);
      setSuccess('🔍 OCR completato con successo!');
      setShowPreview(true);
    } catch (error) {
      console.error('OCR error:', error);
      setError('❌ Errore OCR: ' + error.message);
      setMermaidCode('// Errore OCR: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCanvasText('');
    setMermaidCode('');
    setError('');
    setSuccess('');
    setCopied(false);
    setShowPreview(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('❌ Seleziona un file immagine valido');
      return;
    }
    
    // Reset error and success messages
    setError('');
    setSuccess('');
    
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          setError('❌ Canvas non disponibile');
          return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate aspect ratio to fit image properly
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        // Draw image
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        setSuccess('📸 Immagine caricata con successo!');
        
        // Clear file input
        e.target.value = '';
      };
      
      img.onerror = () => {
        setError('❌ Errore nel caricamento dell\'immagine');
      };
      
      img.src = reader.result;
    };
    
    reader.onerror = () => {
      setError('❌ Errore nella lettura del file');
    };
    
    reader.readAsDataURL(file);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('❌ Errore nel copiare il codice');
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([mermaidCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mermaid-diagram.mmd';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadExample = (example) => {
    setCanvasText(example.text);
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let lastX = 0;
    let lastY = 0;

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const startDrawing = (e) => {
      isDrawing.current = true;
      const pos = getMousePos(e);
      [lastX, lastY] = [pos.x, pos.y];
    };

    const draw = (e) => {
      if (!isDrawing.current) return;
      
      const pos = getMousePos(e);
      const currentX = pos.x;
      const currentY = pos.y;
      
      ctx.strokeStyle = eraserMode ? '#ffffff' : brushColor;
      ctx.lineWidth = eraserMode ? 20 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
      
      [lastX, lastY] = [currentX, currentY];
    };

    const stopDrawing = () => {
      isDrawing.current = false;
    };

    // Add touch support for mobile
    const startDrawingTouch = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      startDrawing(mouseEvent);
    };

    const drawTouch = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      draw(mouseEvent);
    };

    const stopDrawingTouch = (e) => {
      e.preventDefault();
      stopDrawing();
    };

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', startDrawingTouch, { passive: false });
    canvas.addEventListener('touchmove', drawTouch, { passive: false });
    canvas.addEventListener('touchend', stopDrawingTouch, { passive: false });

    return () => {
      // Mouse events
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);

      // Touch events
      canvas.removeEventListener('touchstart', startDrawingTouch);
      canvas.removeEventListener('touchmove', drawTouch);
      canvas.removeEventListener('touchend', stopDrawingTouch);
    };
  }, [eraserMode, brushSize, brushColor]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header con design moderno */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Mermaid Sketcher
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Trasforma le tue idee in diagrammi Mermaid professionali con AI
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs moderni */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-white/20">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'text'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Input Testuale
            </button>
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'canvas'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <PencilLine className="w-5 h-5 inline mr-2" />
              Lavagna Grafica
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Sparkles className="w-6 h-6 mr-3 text-blue-500" />
                  {activeTab === 'text' ? 'Input Testuale' : 'Lavagna Grafica'}
                </h2>
                <button
                  onClick={handleReset}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Resetta tutto"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {activeTab === 'text' ? (
                <>
                  {/* Esempi migliorati */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                      Esempi rapidi:
                    </p>
                    <div className="space-y-3">
                      {examples.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => loadExample(example)}
                          className="block w-full text-left p-4 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-md transform hover:scale-[1.02]"
                        >
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{example.icon}</span>
                            <span className="font-semibold text-gray-800">{example.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={12}
                    value={canvasText}
                    onChange={(e) => setCanvasText(e.target.value)}
                    placeholder="Es: L'utente invia un modulo → Il sistema verifica → Se dati validi, invia conferma..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 resize-none bg-white/80 backdrop-blur-sm"
                  />
                  
                  <button 
                    onClick={handleConvert} 
                    disabled={loading}
                    style={{
                      width: '100%',
                      marginTop: '24px',
                      padding: '16px 24px',
                      background: loading 
                        ? 'linear-gradient(to right, #9ca3af, #6b7280)' 
                        : !canvasText.trim()
                        ? 'linear-gradient(to right, #f59e0b, #dc2626)'
                        : 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                      color: 'white',
                      fontWeight: '600',
                      borderRadius: '12px',
                      transition: 'all 0.3s',
                      transform: 'scale(1)',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                  >
                    {loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid #ffffff',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          marginRight: '12px'
                        }}></div>
                        Generando...
                      </div>
                    ) : !canvasText.trim() ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ marginRight: '8px' }}>⚠️</span>
                        Inserisci testo per generare
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ marginRight: '8px' }}>🔧</span>
                        Genera Mermaid
                      </div>
                    )}
                  </button>
                  
                  {/* Pulsante di test rapido */}
                  {!canvasText.trim() && (
                    <button 
                      onClick={() => {
                        setCanvasText('Utente inserisce credenziali → Sistema verifica → Se valide → Accesso consentito → Se non valide → Mostra errore');
                        setError('');
                        setSuccess('');
                      }}
                      style={{
                        width: '100%',
                        marginTop: '12px',
                        padding: '12px 24px',
                        background: 'linear-gradient(to right, #10b981, #059669)',
                        color: 'white',
                        fontWeight: '500',
                        borderRadius: '12px',
                        transition: 'all 0.3s',
                        transform: 'scale(1)',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ marginRight: '8px' }}>⚡</span>
                        Prova con esempio rapido
                      </div>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* Controlli Canvas */}
                  <div className="mb-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Palette className="w-5 h-5 text-gray-600" />
                          <input
                            type="color"
                            value={brushColor}
                            onChange={(e) => setBrushColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Spessore:</span>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="w-24"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEraserMode(!eraserMode)}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                          eraserMode 
                            ? 'bg-red-500 text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Eraser className="w-4 h-4 inline mr-2" />
                        {eraserMode ? 'Disegna' : 'Gomma'}
                      </button>
                      
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <div className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer text-sm font-medium transition-colors">
                          <ImageIcon className="w-4 h-4" />
                          Carica
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Canvas */}
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={400}
                      className="w-full h-auto cursor-crosshair"
                      style={{ touchAction: 'none' }}
                    />
                  </div>

                  <button 
                    onClick={handleConvertFromCanvas} 
                    disabled={loading}
                    className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Analizzando...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Genera da Disegno
                      </div>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Code2 className="w-6 h-6 mr-3 text-purple-500" />
                  Codice Mermaid Generato
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={handleCopyCode}
                    disabled={!mermaidCode || mermaidCode.startsWith('//')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? (
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Copiato!
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Copy className="w-4 h-4 mr-2" />
                        Copia
                      </div>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadCode}
                    disabled={!mermaidCode || mermaidCode.startsWith('//')}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Scarica
                  </button>
                </div>
              </div>

              {/* Status Messages */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-green-700 font-medium">{success}</span>
                </div>
              )}

              <textarea
                rows={16}
                readOnly
                value={mermaidCode}
                className="w-full p-4 font-mono text-sm bg-gray-50 border-2 border-gray-200 rounded-xl resize-none"
                placeholder="Il codice Mermaid generato apparirà qui..."
              />

              {/* Preview Toggle */}
              {mermaidCode && !mermaidCode.startsWith('//') && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Nascondi' : 'Mostra'} Anteprima
                  </button>
                  
                  {showPreview && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Anteprima del diagramma:
                      </h3>
                      <div className="bg-white p-4 rounded-lg border">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{mermaidCode}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
