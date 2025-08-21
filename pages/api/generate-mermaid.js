// Cache per memorizzare risultati già generati
export const resultCache = new Map();

// Funzione per pulire la cache ogni 100 elementi
function cleanCache() {
  if (resultCache.size > 100) {
    const keysToDelete = Array.from(resultCache.keys()).slice(0, 50);
    keysToDelete.forEach(key => resultCache.delete(key));
    console.log('Cache pulita, rimossi 50 elementi vecchi');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, model: requestedModel = 'gpt-4', inputText } = req.body || {};
  if (!apiKey) return res.status(400).json({ error: 'Missing API key' });
  if (!inputText) return res.status(400).json({ error: 'Missing input text' });
  
  // Crea una chiave di cache basata su input + modello
  const cacheKey = `${inputText.trim()}_${requestedModel}`;
  
  // Controlla se abbiamo già un risultato in cache
  if (resultCache.has(cacheKey)) {
    console.log('Risultato trovato in cache per:', cacheKey.substring(0, 50) + '...');
    return res.status(200).json(resultCache.get(cacheKey));
  }

  // Selezione automatica del modello basata sulla lunghezza del testo
  let selectedModel = requestedModel;
  if (inputText.length > 5000) {
    selectedModel = 'gpt-4o'; // Per testi lunghi usa GPT-4o
  } else if (inputText.length > 2000) {
    selectedModel = 'gpt-4'; // Per testi medi usa GPT-4
  } else {
    selectedModel = 'gpt-4o-mini'; // Per testi brevi usa GPT-4o-mini
  }

  try {
    const systemPrompt = `Sei un esperto analista di processi e creatore di diagrammi Mermaid. Il tuo compito è analizzare testi che descrivono procedure, anche quando sono lunghi, imprecisi o espressi in linguaggio parlato, e convertirli in diagrammi Mermaid flowchart chiari e funzionanti.

FASE 1 - ANALISI INTELLIGENTE DEL TESTO:
Prima di creare il diagramma, devi:
1. Identificare TUTTI i verbi d'azione (cliccare, aprire, controllare, verificare, attendere, ecc.)
2. Riconoscere le condizioni decisionali anche se espresse vagamente ("se va bene", "in caso contrario", "quando succede", "se non funziona")
3. Individuare i cicli e ripetizioni anche se impliciti ("torna a", "riprova", "ripeti fino a", "ogni volta che")
4. Estrarre i punti di inizio e fine anche se non espliciti
5. Identificare stati di errore o eccezione ("se non va", "in caso di problema", "se fallisce")
6. Raggruppare azioni sequential i correlate

GESTIONE LINGUAGGIO IMPRECISO:
- "Poi", "Dopo", "Successivamente" → interpreta come sequenza lineare
- "Se non va bene", "Se c'è un problema" → crea decisioni binarie
- "Torna indietro", "Riprova" → identifica come loop
- "Alla fine", "Quando è tutto ok" → riconosci come stato finale
- "Prima devi", "Assicurati che" → identifica come prerequisiti
- "A volte capita", "Può succedere" → gestisci come percorsi alternativi

ETICHETTE DESCRITTIVE INTELLIGENTI:
- Per azioni: usa verbo + oggetto specifico (es: "Controlla stato lampeggio" invece di "Controlla")
- Per decisioni: formula domande chiare (es: "Luce verde lampeggia 3 volte?" invece di "Lampeggio ok?")
- Per stati: descrivi la situazione (es: "Sistema in attesa conferma" invece di "Attesa")
- Per errori: specifica il tipo (es: "Errore connessione database" invece di "Errore")
- Mantieni sempre sotto 30 caratteri ma sii il più descrittivo possibile

REGOLE SINTASSI MERMAID OBBLIGATORIE:
- NON usare mai caratteri accentati (à, è, ì, ò, ù, ñ, ç) nelle etichette - sostituiscili sempre con vocali normali
- NON usare <br/> per andare a capo - mantieni tutto il testo su una riga
- NON usare virgolette nelle etichette dei nodi
- Sostituisci SEMPRE simboli matematici (<, >, =, !=) con testo descrittivo (maggiore, minore, uguale, diverso)
- Usa SOLO caratteri ASCII standard
- Per decisioni complesse, semplifica in domande Si/No

STRUTTURA DIAGRAMMA AVANZATA:
1. Inizia sempre con 'flowchart TD'
2. Crea un nodo di START chiaro anche se non esplicito nel testo
3. Raggruppa azioni correlate in sequenze logiche
4. Crea decisioni binarie per ogni ambiguità
5. Identifica TUTTI i possibili percorsi di errore
6. Aggiungi stati di attesa/pausa quando necessario
7. Termina con nodi END chiari (successo/fallimento)
8. Usa colori per stati critici:
   - Start: fill:#e1f5fe
   - Success: fill:#c8e6c9
   - Error: fill:#ffcdd2
   - Warning: fill:#fff3e0
   - Loop: fill:#f3e5f5
   - Critical: fill:#fff9c4
   - Wait: fill:#f0f4c3

GESTIONE TESTI LUNGHI:
- Identifica macro-fasi e crea sotto-diagrammi logici
- Usa nomi di nodi che riassumono gruppi di azioni
- Prioritizza il flusso principale e aggiungi percorsi secondari
- Se ci sono più di 20 step, raggruppa azioni simili

INFERENZA LOGICA:
- Se manca un punto di inizio, deduce dall'azione principale
- Se manca un punto di fine, crea uscite logiche basate sul contesto
- Se i passaggi sono confusi, riordina secondo logica procedurale
- Se mancano condizioni di errore, inferi situazioni di fallimento comuni

TRASFORMAZIONI CARATTERI:
- à,á,ā → a | è,é,ē → e | ì,í,ī → i | ò,ó,ō → o | ù,ú,ū → u
- ñ → n | ç → c | "testo" → testo
- > → maggiore | < → minore | = → uguale | != → diverso

Rispondi SEMPRE con SOLO il codice Mermaid pronto all'uso senza spiegazioni.`;

    const payload = {
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: inputText }
      ],
      temperature: 0.0,
      max_tokens: 2500,
      top_p: 0.1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const json = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: json.error?.message || 'OpenAI error' });
    }

    let mermaid = json.choices?.[0]?.message?.content || '';
    
    // Rimuovi i delimitatori ```mermaid``` e ``` se presenti
    mermaid = mermaid.replace(/^```mermaid\s*/i, '').replace(/\s*```$/i, '').trim();
    
    // Salva il risultato in cache
    const result = { mermaid, model: selectedModel };
    resultCache.set(cacheKey, result);
    console.log('Risultato salvato in cache per:', cacheKey.substring(0, 50) + '...');
    
    // Pulisci la cache se necessario
    cleanCache();
    
    return res.status(200).json(result);
  } catch (e) {
    console.error('generate-mermaid error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


