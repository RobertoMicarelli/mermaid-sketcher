// Endpoint per pulire la cache dei risultati Mermaid
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let totalCleared = 0;
    
    // Importa e pulisci la cache dal file generate-mermaid.js
    try {
      const { resultCache } = await import('./generate-mermaid.js');
      if (resultCache && resultCache.size > 0) {
        const cacheSize = resultCache.size;
        resultCache.clear();
        totalCleared += cacheSize;
        console.log(`Cache generate-mermaid pulita. Rimossi ${cacheSize} elementi.`);
      }
    } catch (error) {
      console.log('Cache generate-mermaid non disponibile o già pulita');
    }

    // Importa e pulisci la cache OCR
    try {
      const { ocrCache } = await import('./ocr-to-mermaid.js');
      if (ocrCache && ocrCache.size > 0) {
        const cacheSize = ocrCache.size;
        ocrCache.clear();
        totalCleared += cacheSize;
        console.log(`Cache OCR pulita. Rimossi ${cacheSize} elementi.`);
      }
    } catch (error) {
      console.log('Cache OCR non disponibile o già pulita');
    }

    console.log(`Pulizia cache completata. Totali elementi rimossi: ${totalCleared}`);
    return res.status(200).json({ 
      message: `Cache pulita con successo. Rimossi ${totalCleared} elementi totali.`,
      clearedItems: totalCleared 
    });
  } catch (error) {
    console.error('Errore durante la pulizia della cache:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
