export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input } = req.body;

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Input text is required' });
  }

  try {
    const lines = input.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return res.status(400).json({ error: 'No valid content found' });
    }

    // Detect diagram type based on content
    let diagramType = 'flowchart';
    let direction = 'TD'; // Top-Down
    
    // Check if it looks like a sequence diagram
    if (input.toLowerCase().includes('sequence') || 
        input.toLowerCase().includes('interaction') ||
        lines.some(line => line.includes('->') || line.includes('→'))) {
      diagramType = 'sequenceDiagram';
    }
    
    // Check if it looks like a class diagram
    if (input.toLowerCase().includes('class') || 
        input.toLowerCase().includes('method') ||
        input.toLowerCase().includes('property')) {
      diagramType = 'classDiagram';
    }

    let mermaidCode = '';
    
    if (diagramType === 'sequenceDiagram') {
      mermaidCode = 'sequenceDiagram\n';
      lines.forEach(line => {
        const cleanLine = line.trim();
        if (cleanLine.includes('->') || cleanLine.includes('→')) {
          const parts = cleanLine.split(/->|→/).map(s => s.trim());
          if (parts.length >= 2) {
            mermaidCode += `    ${parts[0]}->>${parts[1]}: ${parts[2] || 'message'}\n`;
          }
        } else if (cleanLine) {
          mermaidCode += `    Note over ${cleanLine}\n`;
        }
      });
    } else if (diagramType === 'classDiagram') {
      mermaidCode = 'classDiagram\n';
      lines.forEach(line => {
        const cleanLine = line.trim();
        if (cleanLine.includes('class') || cleanLine.includes('Class')) {
          const className = cleanLine.replace(/class\s+/i, '').replace(/\s*\{.*\}/, '');
          mermaidCode += `    class ${className}\n`;
        } else if (cleanLine.includes('method') || cleanLine.includes('function')) {
          const methodName = cleanLine.replace(/method\s+/i, '').replace(/\s*\{.*\}/, '');
          mermaidCode += `    ${methodName}()\n`;
        } else if (cleanLine) {
          mermaidCode += `    ${cleanLine}\n`;
        }
      });
    } else {
      // Default flowchart
      mermaidCode = `flowchart ${direction}\n`;
      
      const nodes = new Map();
      let nodeCounter = 0;
      
      lines.forEach((line, index) => {
        const cleanLine = line.trim();
        
        // Handle arrows and connections
        if (cleanLine.includes('-->') || cleanLine.includes('→')) {
          const parts = cleanLine.split(/-->|→/).map(s => s.trim());
          
          if (parts.length >= 2) {
            const from = parts[0];
            const to = parts[1];
            const condition = parts[2] || '';
            
            // Create node IDs
            let fromId = nodes.get(from);
            if (!fromId) {
              fromId = `node${nodeCounter++}`;
              nodes.set(from, fromId);
              mermaidCode += `    ${fromId}["${from}"]\n`;
            }
            
            let toId = nodes.get(to);
            if (!toId) {
              toId = `node${nodeCounter++}`;
              nodes.set(to, toId);
              mermaidCode += `    ${toId}["${to}"]\n`;
            }
            
            // Add connection
            if (condition) {
              mermaidCode += `    ${fromId} -->|${condition}| ${toId}\n`;
            } else {
              mermaidCode += `    ${fromId} --> ${toId}\n`;
            }
          }
        } else if (cleanLine.includes('if') || cleanLine.includes('se')) {
          // Handle conditional statements
          const condition = cleanLine.replace(/if\s+|se\s+/i, '').replace(/\s*\{.*\}/, '');
          const conditionId = `condition${nodeCounter++}`;
          nodes.set(condition, conditionId);
          mermaidCode += `    ${conditionId}{"${condition}"}\n`;
        } else if (cleanLine.includes('else') || cleanLine.includes('altrimenti')) {
          // Handle else statements
          const elseId = `else${nodeCounter++}`;
          mermaidCode += `    ${elseId}["Altrimenti"]\n`;
        } else if (cleanLine) {
          // Regular node
          const nodeId = `node${nodeCounter++}`;
          nodes.set(cleanLine, nodeId);
          mermaidCode += `    ${nodeId}["${cleanLine}"]\n`;
        }
      });
      
      // Add default connections if no explicit connections found
      if (nodes.size > 1 && !mermaidCode.includes('-->')) {
        const nodeIds = Array.from(nodes.values());
        for (let i = 0; i < nodeIds.length - 1; i++) {
          mermaidCode += `    ${nodeIds[i]} --> ${nodeIds[i + 1]}\n`;
        }
      }
    }

    // Clean up the code
    mermaidCode = mermaidCode.trim();
    
    if (!mermaidCode || mermaidCode === `flowchart ${direction}`) {
      return res.status(400).json({ error: 'Could not generate valid Mermaid code from input' });
    }

    res.status(200).json({ mermaid: mermaidCode });
  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({ error: 'Internal server error during conversion' });
  }
}
