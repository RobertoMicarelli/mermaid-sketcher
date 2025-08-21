
import Tesseract from 'tesseract.js';

// Cache per memorizzare risultati OCR già elaborati
export const ocrCache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, model: requestedModel = 'gpt-4o', imageData, imageType } = req.body;
    
    if (!apiKey) return res.status(400).json({ error: 'Missing API key' });
    if (!imageData) return res.status(400).json({ error: 'Missing image data' });

    // Crea una chiave di cache basata su hash dell'immagine + modello
    const imageHash = Buffer.from(imageData, 'base64').toString('hex').substring(0, 32);
    const cacheKey = `${imageHash}_${requestedModel}`;
    
    // Controlla se abbiamo già un risultato in cache
    if (ocrCache.has(cacheKey)) {
      console.log('Risultato OCR trovato in cache per:', cacheKey.substring(0, 20) + '...');
      return res.status(200).json(ocrCache.get(cacheKey));
    }

    // Selezione automatica del modello per OCR
    let selectedModel = requestedModel;
    if (imageType === 'drawing') {
      selectedModel = 'gpt-4o'; // Per disegni usa GPT-4o (migliore analisi visiva)
    } else if (imageType === 'photo') {
      selectedModel = 'gpt-4o'; // Per foto usa GPT-4o
    } else {
      selectedModel = 'gpt-4o-mini'; // Default per altri tipi
    }

    console.log('Avvio OCR per immagine...');
    
    let text = '';
    try {
      // Esegui OCR con Tesseract usando CDN per i file di training
      const ocrPromise = Tesseract.recognize(
        Buffer.from(imageData, 'base64'),
        'ita+eng', // Lingue italiano e inglese
        {
          logger: m => console.log('OCR Progress:', m.status, m.progress),
          errorHandler: err => console.error('OCR Error:', err),
          // Usa CDN per i file di training
          workerPath: 'https://unpkg.com/tesseract.js@5/dist/worker.min.js',
          langPath: 'https://tessdata.projectnaptha.com/4.0.0',
          corePath: 'https://unpkg.com/tesseract.js-core@5/tesseract-core.wasm.js'
        }
      );
      
      // Timeout di 30 secondi per l'OCR
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OCR Timeout')), 30000)
      );
      
      const result = await Promise.race([ocrPromise, timeoutPromise]);
      text = result.data.text;
      console.log('OCR completato. Testo estratto:', text.substring(0, 100) + '...');
    } catch (ocrError) {
      console.error('Errore OCR o timeout, fallback ad analisi visiva pura:', ocrError);
      text = ''; // Forza analisi visiva pura
    }

    // Se non c'è testo, analizza solo la struttura visiva
    if (!text || text.trim().length < 10) {
      console.log('Poco testo trovato, analisi visiva pura...');
      
      const visualPrompt = `# PROMPT: CONVERSIONE SCHIZZO GRAFICO → MERMAID (ANALISI VISIVA PURA)

## Sei un esperto analista di diagrammi che converte schizzi disegnati a mano in diagrammi Mermaid funzionanti.

### FASE 1: ANALISI VISIVA DELLO SCHIZZO
Esamina attentamente l'immagine e identifica:

**ELEMENTI GEOMETRICI:**
- Rettangoli/quadrati → Azioni/Processi 
- Rombi/diamanti → Decisioni/Condizioni
- Cerchi/ovali → Punti di inizio/fine
- Frecce → Direzione del flusso
- Linee curve → Connessioni di ritorno/loop

**CONNESSIONI E FLUSSO:**
- Segui ogni freccia dalla sua origine alla destinazione
- Identifica cicli e loop (frecce che tornano indietro)
- Nota percorsi multipli che escono da un nodo decisionale
- Mappa la sequenza logica generale

### FASE 2: INTERPRETAZIONE SEMANTICA

**RICOSTRUZIONE LOGICA:**
- Identifica il punto di START anche se non esplicito
- Trova tutti i punti di END possibili
- Verifica che ogni decisione abbia almeno 2 percorsi
- Assicurati che ogni loop abbia una condizione di uscita

**VALIDAZIONE DEL FLUSSO:**
- Controlla che non ci siano nodi isolati
- Verifica che il flusso sia logicamente coerente
- Identifica eventuali passaggi mancanti
- Aggiungi collegamenti impliciti se necessari

### FASE 3: CONVERSIONE IN MERMAID

**MAPPATURA NODI:**
- START/END → Nodi ovali: \`([testo])\`
- Azioni → Nodi rettangolari: \`[testo]\`
- Decisioni → Nodi rombo: \`{testo?}\`
- Aggiungi sempre una domanda nelle decisioni (finire con ?)

**ETICHETTE DESCRITTIVE:**
- Usa massimo 25 caratteri per etichetta
- Sii specifico ma conciso: "Cerca ricetta" vs "Cerca"
- Per decisioni, formula domande chiare: "Hai ingredienti?"
- Evita caratteri speciali e accenti

**GESTIONE CONNESSIONI:**
- Usa \`-->\` per frecce semplici
- Aggiungi etichette ai percorsi decisionali: \`-->|Si|\` \`-->|No|\`
- Per i loop, assicurati che tornino al nodo corretto
- Mantieni il flusso leggibile

**APPLICAZIONE COLORI:**
- Usa SOLO la sintassi: \`style NomeNodo fill:#colore\`
- NON usare mai \`classDef\` o \`:::className\`
- Applica i colori DOPO la definizione di tutti i nodi
- Start: \`style NomeNodo fill:#e1f5fe\` (azzurro)
- End/Success: \`style NomeNodo fill:#c8e6c9\` (verde)
- Errori: \`style NomeNodo fill:#ffcdd2\` (rosso)
- Azioni di ricerca/attesa: \`style NomeNodo fill:#fff3e0\` (arancione)
- Loop critici: \`style NomeNodo fill:#f3e5f5\` (viola)

### FASE 4: VALIDAZIONE FINALE

**CONTROLLO SINTASSI:**
- Nessun carattere accentato (à→a, è→e, ecc.)
- Nessun simbolo matematico (<, >, =)
- Nessun <br/> o virgolette nelle etichette
- Solo caratteri ASCII standard

**CONTROLLO LOGICO:**
- Ogni nodo ha almeno una connessione in entrata (tranne START)
- Ogni nodo ha almeno una connessione in uscita (tranne END)
- Tutti i percorsi portano a una conclusione
- I loop hanno condizioni di uscita chiare

**CONTROLLO QUALITÀ:**
- Il diagramma rappresenta fedelmente lo schizzo originale
- Il flusso è logicamente coerente
- Le etichette sono chiare e informative
- I colori evidenziano correttamente gli stati critici

### OUTPUT FINALE

**FORNISCI SOLO IL CODICE MERMAID PURO SENZA VIRGOLETTE, DESCRIZIONI O NOTE.**

Il codice deve essere pulito e pronto per essere copiato e incollato direttamente in MermaidChart.

### REGOLE OBBLIGATORIE:
- Inizia sempre con 'flowchart TD'
- Mantieni etichette brevi (max 25 caratteri)
- Usa SOLO caratteri ASCII standard
- Usa SOLO la sintassi \`style NomeNodo fill:#colore\` per i colori
- NON usare mai \`classDef\` o \`:::className\`
- NON includere virgolette iniziali o finali
- NON includere descrizioni o note nel codice
- NON includere \`\`\`mermaid\` o \`\`\` nel codice
- Il codice deve essere pulito e pronto all'uso`;

      const payload = {
        model: selectedModel,
        messages: [
          { 
            role: 'user', 
            content: [
              { type: 'text', text: visualPrompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: `data:image/${imageType === 'drawing' ? 'png' : 'jpeg'};base64,${imageData}` 
                } 
              }
            ]
          }
        ],
        temperature: 0.0,
        max_tokens: 2000,
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
      
          // Pulizia robusta del codice Mermaid - rimuove TUTTI i backticks e formattazioni
    mermaid = mermaid
      .replace(/^```mermaid\s*/gi, '')  // Rimuove ```mermaid all'inizio
      .replace(/^```\s*/gi, '')         // Rimuove ``` all'inizio
      .replace(/\s*```$/gi, '')         // Rimuove ``` alla fine
      .replace(/^`/g, '')               // Rimuove ` singolo all'inizio
      .replace(/`$/g, '')               // Rimuove ` singolo alla fine
      .trim();
    
    // Verifica che il codice inizi con 'flowchart TD' e non contenga backticks
    if (!mermaid.startsWith('flowchart TD')) {
      throw new Error('Codice Mermaid non valido: deve iniziare con "flowchart TD"');
    }
    
    if (mermaid.includes('```') || mermaid.includes('`')) {
      console.warn('Backticks rilevati nel codice Mermaid, tentativo di pulizia aggiuntiva...');
      mermaid = mermaid.replace(/```/g, '').replace(/`/g, '').trim();
    }
    
    // Verifica che il codice inizi con 'flowchart TD' e non contenga backticks
    if (!mermaid.startsWith('flowchart TD')) {
      throw new Error('Codice Mermaid non valido: deve iniziare con "flowchart TD"');
    }
    
    if (mermaid.includes('```') || mermaid.includes('`')) {
      console.warn('Backticks rilevati nel codice Mermaid, tentativo di pulizia aggiuntiva...');
      mermaid = mermaid.replace(/```/g, '').replace(/`/g, '').trim();
    }
      
      const result = { mermaid, model: selectedModel, ocrText: '', analysisType: 'visual' };
      ocrCache.set(cacheKey, result);
      console.log('Risultato analisi visiva salvato in cache');
      
      return res.status(200).json(result);
    }

    // Se c'è testo, combina OCR + analisi visiva
    console.log('Combinazione OCR + analisi visiva...');
    
    const combinedPrompt = `# PROMPT: CONVERSIONE SCHIZZO GRAFICO → MERMAID

## Sei un esperto analista di diagrammi che converte schizzi disegnati a mano in diagrammi Mermaid funzionanti.

### FASE 1: ANALISI VISIVA DELLO SCHIZZO
Prima di tutto, esamina attentamente l'immagine e identifica:

**ELEMENTI GEOMETRICI:**
- Rettangoli/quadrati → Azioni/Processi 
- Rombi/diamanti → Decisioni/Condizioni
- Cerchi/ovali → Punti di inizio/fine
- Frecce → Direzione del flusso
- Linee curve → Connessioni di ritorno/loop

**TESTO SCRITTO A MANO (ANALISI OCR):**
"${text}"

- Trascrivi TUTTO il testo visibile, anche se poco leggibile
- Per ogni parola dubbia o poco chiara, usa il formato: [PAROLA_DUBBIA?]
- Non assumere significati - descrivi esattamente ciò che vedi
- Nota abbreviazioni, parole incomplete o grafie alternative
- Segnala chiaramente le parole completamente illeggibili come [ILLEGGIBILE]
 ad
**CONNESSIONI E FLUSSO:**
- Segui ogni freccia dalla sua origine alla destinazione
- Identifica cicli e loop (frecce che tornano indietro)
- Nota percorsi multipli che escono da un nodo decisionale
- Mappa la sequenza logica generale

### FASE 2: INTERPRETAZIONE SEMANTICA

**DECODIFICA DEL LINGUAGGIO:**
- Riconosci abbreviazioni comuni (es: "ricatch" = "ricetta")
- Interpreta termini gergali o colloquiali nel contesto
- Identifica il dominio/settore (cucina, IT, business, ecc.)
- Chiarisci ambiguità basandoti sul contesto generale

**RICOSTRUZIONE LOGICA:**
- Identifica il punto di START anche se non esplicito
- Trova tutti i punti di END possibili
- Verifica che ogni decisione abbia almeno 2 percorsi
- Assicurati che ogni loop abbia una condizione di uscita

**VALIDAZIONE DEL FLUSSO:**
- Controlla che non ci siano nodi isolati
- Verifica che il flusso sia logicamente coerente
- Identifica eventuali passaggi mancanti
- Aggiungi collegamenti impliciti se necessari

### FASE 3: CONVERSIONE IN MERMAID

**MAPPATURA NODI:**
- START/END → Nodi ovali: \`([testo])\`
- Azioni → Nodi rettangolari: \`[testo]\`
- Decisioni → Nodi rombo: \`{testo?}\`
- Aggiungi sempre una domanda nelle decisioni (finire con ?)

**ETICHETTE DESCRITTIVE:**
- Usa massimo 25 caratteri per etichetta
- Sii specifico ma conciso: "Cerca ricetta" vs "Cerca"
- Per decisioni, formula domande chiare: "Hai ingredienti?"
- Evita caratteri speciali e accenti

**GESTIONE CONNESSIONI:**
- Usa \`-->\` per frecce semplici
- Aggiungi etichette ai percorsi decisionali: \`-->|Si|\` \`-->|No|\`
- Per i loop, assicurati che tornino al nodo corretto
- Mantieni il flusso leggibile

**APPLICAZIONE COLORI:**
- Usa SOLO la sintassi: \`style NomeNodo fill:#colore\`
- NON usare mai \`classDef\` o \`:::className\`
- Applica i colori DOPO la definizione di tutti i nodi
- Start: \`style NomeNodo fill:#e1f5fe\` (azzurro)
- End/Success: \`style NomeNodo fill:#c8e6c9\` (verde)
- Errori: \`style NomeNodo fill:#ffcdd2\` (rosso)
- Azioni di ricerca/attesa: \`style NomeNodo fill:#fff3e0\` (arancione)
- Loop critici: \`style NomeNodo fill:#f3e5f5\` (viola)

### FASE 4: VALIDAZIONE FINALE

**CONTROLLO SINTASSI:**
- Nessun carattere accentato (à→a, è→e, ecc.)
- Nessun simbolo matematico (<, >, =)
- Nessun <br/> o virgolette nelle etichette
- Solo caratteri ASCII standard

**CONTROLLO LOGICO:**
- Ogni nodo ha almeno una connessione in entrata (tranne START)
- Ogni nodo ha almeno una connessione in uscita (tranne END)
- Tutti i percorsi portano a una conclusione
- I loop hanno condizioni di uscita chiare

**CONTROLLO QUALITÀ:**
- Il diagramma rappresenta fedelmente lo schizzo originale
- Il flusso è logicamente coerente
- Le etichette sono chiare e informative
- I colori evidenziano correttamente gli stati critici

### OUTPUT FINALE

**FORNISCI SOLO IL CODICE MERMAID PURO SENZA VIRGOLETTE, DESCRIZIONI O NOTE.**

Il codice deve essere pulito e pronto per essere copiato e incollato direttamente in MermaidChart.

### REGOLE OBBLIGATORIE:
- Inizia sempre con 'flowchart TD'
- Mantieni etichette brevi (max 25 caratteri)
- Usa SOLO caratteri ASCII standard
- Usa SOLO la sintassi \`style NomeNodo fill:#colore\` per i colori
- NON usare mai \`classDef\` o \`:::className\`
- NON includere virgolette iniziali o finali
- NON includere descrizioni o note nel codice
- NON includere \`\`\`mermaid\` o \`\`\` nel codice
- Il codice deve essere pulito e pronto all'uso`;

    const payload = {
      model: selectedModel,
      messages: [
        { 
          role: 'user', 
          content: [
            { type: 'text', text: combinedPrompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:image/${imageType === 'drawing' ? 'png' : 'jpeg'};base64,${imageData}` 
              } 
            }
          ]
        }
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
    
    // Pulizia robusta del codice Mermaid - rimuove TUTTI i backticks e formattazioni
    mermaid = mermaid
      .replace(/^```mermaid\s*/gi, '')  // Rimuove ```mermaid all'inizio
      .replace(/^```\s*/gi, '')         // Rimuove ``` all'inizio
      .replace(/\s*```$/gi, '')         // Rimuove ``` alla fine
      .replace(/^`/g, '')               // Rimuove ` singolo all'inizio
      .replace(/`$/g, '')               // Rimuove ` singolo alla fine
      .trim();
    
    const result = { mermaid, model: selectedModel, ocrText: text, analysisType: 'combined' };
    ocrCache.set(cacheKey, result);
    console.log('Risultato OCR combinato salvato in cache');
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('OCR to Mermaid error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
