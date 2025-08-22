export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mermaidCode, apiKey } = req.body;

  if (!mermaidCode) {
    return res.status(400).json({ error: 'Codice Mermaid richiesto' });
  }

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key richiesta' });
  }

  try {
    console.log('🔧 Iniziando correzione codice Mermaid:', mermaidCode.substring(0, 100) + '...');
    
    const prompt = `Sei un esperto debugger di codice Mermaid versione 11.10.0. Il tuo compito è analizzare codice Mermaid che presenta errori di sintassi e correggerlo secondo le specifiche ufficiali di https://mermaid.js.org/intro/syntax-reference.html

REGOLE DI DEBUGGING:
1. Analizza il codice riga per riga
2. Identifica TUTTI gli errori di sintassi presenti
3. Applica le correzioni secondo le specifiche v11.10.0
4. Mantieni la logica e struttura originale del diagramma
5. Rispondi SOLO con il codice Mermaid corretto

CASISTICA ERRORI TIPICI E CORREZIONI:

ERRORE 1 - CARATTERI SPECIALI NON QUOTATI:
❌ ERRATO: D[p = 2 * (b + h)]
✅ CORRETTO: D["p = 2 * (b + h)"]
Regola: Parentesi tonde, asterischi, simboli matematici devono essere quotati

ERRORE 2 - CARATTERI ACCENTATI:
❌ ERRATO: A[Città]
✅ CORRETTO: A[Citta]
Regola: Rimuovi tutti gli accenti (à→a, è→e, ì→i, ò→o, ù→u)

ERRORE 3 - SIMBOLI MATEMATICI NON GESTITI:
❌ ERRATO: B{x > 5?}
✅ CORRETTO: B{x maggiore 5?}
Regola: Sostituisci >, <, =, != con testo (maggiore, minore, uguale, diverso)

ERRORE 4 - SINTASSI COLORI MISTA:
❌ ERRATO: A([Start]):::start; classDef start fill:#e1f5fe;
✅ CORRETTO: A([Start]); style A fill:#e1f5fe
Regola: Usa SOLO syntax "style NomeNodo fill:#colore"

ERRORE 5 - ID NODI CON SPAZI:
❌ ERRATO: My Node[Testo]
✅ CORRETTO: MyNode[Testo]
Regola: ID nodi senza spazi, caratteri speciali o iniziare con numeri

ERRORE 6 - ARROW SYNTAX SBAGLIATA:
❌ ERRATO: A -> B
✅ CORRETTO: A --> B
Regola: Usa sempre --> per frecce semplici

ERRORE 7 - PARENTESI NON BILANCIATE:
❌ ERRATO: A[Formula: (x + y]
✅ CORRETTO: A["Formula: (x + y)"]
Regola: Ogni parentesi aperta deve essere chiusa, quota se contiene formule

ERRORE 8 - PAROLE RISERVATE COME ID:
❌ ERRATO: end[Fine processo]
✅ CORRETTO: EndNode[Fine processo]
Regola: Non usare: start, end, class, style, click come ID nodi

ERRORE 9 - VIRGOLETTE NON ESCAPE:
❌ ERRATO: A[L'utente dice "ciao"]
✅ CORRETTO: A["L utente dice ciao"]
Regola: Rimuovi apostrofi e virgolette interne o usa escape

ERRORE 10 - LINE BREAKS NELLE ETICHETTE:
❌ ERRATO: A[Prima riga<br/>Seconda riga]
✅ CORRETTO: A[Prima riga Seconda riga]
Regola: Niente <br/>, mantieni testo su una riga

ERRORE 11 - CARATTERI UNICODE SPECIALI:
❌ ERRATO: A[Freccia →]
✅ CORRETTO: A[Freccia va a]
Regola: Solo caratteri ASCII standard

ERRORE 12 - DOPPI SPAZI O TAB:
❌ ERRATO: A  -->  B
✅ CORRETTO: A --> B
Regola: Un solo spazio tra elementi

ERRORE 13 - PUNTO E VIRGOLA EXTRA:
❌ ERRATO: A --> B;
✅ CORRETTO: A --> B
Regola: Niente punto e virgola nelle connessioni

ERRORE 14 - COMMENTI MAL FORMATTATI:
❌ ERRATO: A --> B // commento
✅ CORRETTO: A --> B
Regola: Rimuovi commenti, non supportati ovunque

ERRORE 15 - NOMI NODI DUPLICATI:
❌ ERRATO: A[Primo]; A[Secondo];
✅ CORRETTO: A[Primo]; B[Secondo];
Regola: Ogni nodo deve avere ID univoco

PROCEDURA DI DEBUG:
1. Leggi tutto il codice Mermaid fornito
2. Identifica il tipo di diagramma (flowchart, sequence, etc.)
3. Controlla la sintassi generale (flowchart TD, etc.)
4. Analizza ogni nodo e connessione
5. Applica le correzioni dalla casistica sopra
6. Verifica che tutti i nodi siano collegati correttamente
7. Controlla la sintassi dei colori se presenti
8. Restituisci il codice pulito e funzionante

OUTPUT: Fornisci SOLO il codice Mermaid corretto, senza spiegazioni o commenti aggiuntivi.

ECCO IL CODICE DA CORREGGERE:

${mermaidCode}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Sei un esperto di sintassi Mermaid. Correggi solo gli errori di sintassi e restituisci il codice corretto senza spiegazioni.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Risposta OpenAI ricevuta:', data.choices[0].message.content.substring(0, 100) + '...');
    
    const correctedCode = data.choices[0].message.content.trim();

    // Rimuovi eventuali backticks e "mermaid" dal risultato
    const cleanCode = correctedCode.replace(/```mermaid\s*/g, '').replace(/```\s*$/g, '');
    
    console.log('🎉 Codice corretto:', cleanCode.substring(0, 100) + '...');

    res.status(200).json({ 
      correctedMermaid: cleanCode,
      success: true 
    });

  } catch (error) {
    console.error('Error fixing Mermaid syntax:', error);
    res.status(500).json({ 
      error: 'Errore durante la correzione del codice Mermaid',
      details: error.message 
    });
  }
}
