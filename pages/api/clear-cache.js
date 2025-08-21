// Endpoint per pulire la cache dei risultati Mermaid
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Importa la cache dal file generate-mermaid.js
    const { resultCache } = await import('./generate-mermaid.js');
    
    if (resultCache && resultCache.size > 0) {
      const cacheSize = resultCache.size;
      resultCache.clear();
      console.log(`Cache pulita manualmente. Rimossi ${cacheSize} elementi.`);
      return res.status(200).json({ 
        message: `Cache pulita con successo. Rimossi ${cacheSize} elementi.`,
        clearedItems: cacheSize 
      });
    } else {
      return res.status(200).json({ 
        message: 'Cache già vuota o non disponibile.',
        clearedItems: 0 
      });
    }
  } catch (error) {
    console.error('Errore durante la pulizia della cache:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
