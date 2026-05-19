import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const LaTeXRenderer = ({ text, block = false, inline = false }) => {
  if (!text) return null;
  if (typeof text !== 'string') {
    console.error('LaTeXRenderer: text prop must be a string, received:', typeof text, text);
    return <span className="text-red-600">Error: Invalid content type</span>;
  }

  const renderKatex = (latex, displayMode, key) => {
    try {
      const html = katex.renderToString(latex, { displayMode, throwOnError: false });
      return displayMode
        ? <div key={key} dangerouslySetInnerHTML={{ __html: html }} className="my-2" />
        : <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span key={key}>{latex}</span>;
    }
  };

  // Normalise \(...\) → $...$ and \[...\] → $$...$$ so the splitter below handles all formats.
  const normalise = (s) =>
    s
      .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `$$${m}$$`)
      .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m}$`);

  const renderMathText = (content) => {
    if (!content || typeof content !== 'string') return '';

    const normalised = normalise(content);

    // Split by display math ($$...$$) first
    const displayParts = normalised.split(/(\$\$[\s\S]*?\$\$)/g);

    return displayParts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return renderKatex(part.slice(2, -2).trim(), true, index);
      }

      // Split remainder by inline math ($...$)
      const inlineParts = part.split(/(\$[^$]+?\$)/g);

      return inlineParts.map((inlinePart, inlineIndex) => {
        if (inlinePart.startsWith('$') && inlinePart.endsWith('$') && inlinePart.length > 2) {
          return renderKatex(inlinePart.slice(1, -1), false, `${index}-${inlineIndex}`);
        }

        // Plain text — preserve newlines
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
