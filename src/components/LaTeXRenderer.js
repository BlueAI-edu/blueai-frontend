import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const LaTeXRenderer = ({ text, block = false, inline = false }) => {
  // Ensure text is a string
  if (!text) return null;
  if (typeof text !== 'string') {
    console.error('LaTeXRenderer: text prop must be a string, received:', typeof text, text);
    return <span className="text-red-600">Error: Invalid content type</span>;
  }

  // Function to render LaTeX within text
  const renderMathText = (content) => {
    if (!content || typeof content !== 'string') return '';

    // Split by display math ($$...$$)
    const displayParts = content.split(/(\$\$[\s\S]*?\$\$)/g);
    
    return displayParts.map((part, index) => {
      // Check if this is display math
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const latex = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(latex, {
            displayMode: true,
            throwOnError: false,
            trust: true
          });
          return <div key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-2" />;
        } catch (e) {
          return <span key={index} className="text-red-600">{part}</span>;
        }
      }

      // Split by inline math ($...$)
      const inlineParts = part.split(/(\$[^$]+?\$)/g);
      
      return inlineParts.map((inlinePart, inlineIndex) => {
        if (inlinePart.startsWith('$') && inlinePart.endsWith('$') && inlinePart.length > 2) {
          const latex = inlinePart.slice(1, -1);
          try {
            const html = katex.renderToString(latex, {
              displayMode: false,
              throwOnError: false,
              trust: true
            });
            return <span key={`${index}-${inlineIndex}`} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <span key={`${index}-${inlineIndex}`} className="text-red-600">{inlinePart}</span>;
          }
        }
        
        // Regular text - preserve line breaks
        return inlinePart.split('\n').map((line, lineIndex, arr) => (
          <React.Fragment key={`${index}-${inlineIndex}-${lineIndex}`}>
            {line}
            {lineIndex < arr.length - 1 && <br />}
          </React.Fragment>
        ));
      });
    });
  };

  return (
    <div className={block ? 'latex-block' : 'latex-inline'}>
      {renderMathText(text)}
    </div>
  );
};

export default LaTeXRenderer;
