# 🔍 Configurazione Tesseract.js per Mermaid Sketcher

## 📋 Panoramica

Mermaid Sketcher utilizza Tesseract.js per l'OCR (Optical Character Recognition) per estrarre testo dalle immagini caricate o disegnate.

## 🚀 Configurazione Automatica (Raccomandato)

Il progetto è configurato per utilizzare automaticamente i file di training da CDN:

- **Worker**: `https://unpkg.com/tesseract.js@5/dist/worker.min.js`
- **Lingue**: `https://tessdata.projectnaptha.com/4.0.0`
- **Core**: `https://unpkg.com/tesseract.js-core@5/tesseract-core.wasm.js`

## 🔧 Configurazione Locale (Opzionale)

Per sviluppo locale o per migliorare le performance, puoi scaricare i file di training:

### 1. Scarica i File di Training

```bash
# Crea directory tessdata
mkdir tessdata

# Scarica file per italiano
wget https://tessdata.projectnaptha.com/4.0.0/ita.traineddata -O tessdata/ita.traineddata

# Scarica file per inglese
wget https://tessdata.projectnaptha.com/4.0.0/eng.traineddata -O tessdata/eng.traineddata
```

### 2. Configurazione Locale

Se hai i file locali, modifica `pages/api/ocr-to-mermaid.js`:

```javascript
const ocrPromise = Tesseract.recognize(
  Buffer.from(imageData, 'base64'),
  'ita+eng',
  {
    logger: m => console.log('OCR Progress:', m.status, m.progress),
    errorHandler: err => console.error('OCR Error:', err),
    // Usa file locali invece di CDN
    langPath: './tessdata'
  }
);
```

## 🌐 Lingue Supportate

- **Italiano** (`ita`): Per testo in italiano
- **Inglese** (`eng`): Per testo in inglese
- **Combinato** (`ita+eng`): Per testo misto

## ⚡ Ottimizzazioni

### Performance
- I file di training vengono scaricati automaticamente al primo utilizzo
- Cache locale per evitare download ripetuti
- Timeout di 30 secondi per evitare blocchi

### Fallback
- Se OCR fallisce, il sistema usa analisi visiva pura
- Gestione errori robusta per ambiente di produzione

## 🐛 Risoluzione Problemi

### OCR non funziona
```bash
# Verifica connessione internet per CDN
curl https://tessdata.projectnaptha.com/4.0.0/ita.traineddata

# Controlla log per errori specifici
# Fallback automatico ad analisi visiva
```

### Performance lente
- I file di training sono grandi (~8MB)
- Prima esecuzione può richiedere più tempo
- Successive esecuzioni sono più veloci

## 📊 Statistiche

- **Dimensione file training**: ~8MB totali
- **Tempo primo caricamento**: 10-30 secondi
- **Tempo OCR**: 5-15 secondi
- **Precisione**: >85% per testo chiaro

## 🔗 Risorse

- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
- [Tessdata Repository](https://github.com/tesseract-ocr/tessdata)
- [Language Files](https://tessdata.projectnaptha.com/4.0.0/)
