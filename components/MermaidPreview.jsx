"use client";

import { useState, useRef, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle, Loader2, Wrench } from 'lucide-react';

export default function MermaidPreview({ mermaidCode, onCodeUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFixing, setIsFixing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    if (mermaidCode && !mermaidCode.startsWith('//')) {
      renderMermaid();
    }
  }, [mermaidCode]);

  const renderMermaid = async () => {
    if (!mermaidCode || mermaidCode.startsWith('//')) return;

    setIsLoading(true);
    setError('');

    try {
      // Importa mermaid dinamicamente
      const mermaid = await import('mermaid');
      
      // Configura mermaid
      mermaid.default.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Arial, sans-serif'
      });

      // Pulisci il contenitore
      if (previewRef.current) {
        previewRef.current.innerHTML = '';
      }

      // Renderizza il diagramma
      const { svg } = await mermaid.default.render('mermaid-diagram', mermaidCode);
      
      if (previewRef.current) {
        previewRef.current.innerHTML = svg;
      }
      
      setError('');
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      setError('Errore nella sintassi Mermaid');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixSyntax = async () => {
    setIsFixing(true);
    setError('');

    try {
      const response = await fetch('/api/fix-mermaid-syntax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mermaidCode })
      });

      if (!response.ok) {
        throw new Error('Errore nella correzione');
      }

      const data = await response.json();
      
      if (data.success && data.correctedMermaid) {
        onCodeUpdate(data.correctedMermaid);
        setShowErrorModal(false);
      } else {
        throw new Error('Impossibile correggere il codice');
      }
    } catch (err) {
      console.error('Error fixing syntax:', err);
      setError('Errore durante la correzione automatica');
    } finally {
      setIsFixing(false);
    }
  };

  const downloadAsImage = async (format = 'png') => {
    if (!previewRef.current || !mermaidCode || mermaidCode.startsWith('//')) {
      return;
    }

    try {
      const svgElement = previewRef.current.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG non trovato');
      }

      // Crea un canvas per convertire SVG in immagine
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Ottieni le dimensioni dell'SVG
      const svgRect = svgElement.getBoundingClientRect();
      const width = svgRect.width;
      const height = svgRect.height;
      
      // Imposta le dimensioni del canvas
      canvas.width = width * 2; // 2x per migliore qualità
      canvas.height = height * 2;
      ctx.scale(2, 2);

      // Converti SVG in stringa
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Crea un'immagine dall'SVG
      const img = new Image();
      img.onload = () => {
        // Disegna l'immagine sul canvas
        ctx.drawImage(img, 0, 0);
        
        // Converti in formato richiesto
        canvas.toBlob((blob) => {
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `mermaid-diagram.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
        }, `image/${format}`);
        
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error('Download error:', err);
      setError('Errore durante il download');
    }
  };

  if (!mermaidCode || mermaidCode.startsWith('//')) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
          Anteprima del Diagramma
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => downloadAsImage('png')}
            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium text-sm flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            PNG
          </button>
          <button
            onClick={() => downloadAsImage('jpeg')}
            className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors font-medium text-sm flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            JPG
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">Caricamento diagramma...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={handleFixSyntax}
              disabled={isFixing}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center mx-auto"
            >
              {isFixing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Correggendo...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Correggi Automaticamente
                </>
              )}
            </button>
          </div>
        ) : (
          <div 
            ref={previewRef}
            className="flex justify-center overflow-auto"
            style={{ minHeight: '200px' }}
          />
        )}
      </div>

      {/* Modal per errori di sintassi */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
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
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Correggendo...
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4 mr-2" />
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
