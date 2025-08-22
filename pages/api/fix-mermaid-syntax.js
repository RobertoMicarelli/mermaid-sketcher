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
    const prompt = `E' stato generato questo codice Mermaid ma ci sono errori di sintassi, puoi controllare con attenzione il codice in base alle specifiche Mermaid versione 11.10.0: https://mermaid.js.org/intro/syntax-reference.html#syntax-structure :

ECCO IL CODICE:

${mermaidCode}

Per favore correggi gli errori di sintassi secondo la versione Mermaid 11.10.0 e restituisci SOLO il codice Mermaid corretto, senza spiegazioni aggiuntive.`;

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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const correctedCode = data.choices[0].message.content.trim();

    // Rimuovi eventuali backticks e "mermaid" dal risultato
    const cleanCode = correctedCode.replace(/```mermaid\s*/g, '').replace(/```\s*$/g, '');

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
