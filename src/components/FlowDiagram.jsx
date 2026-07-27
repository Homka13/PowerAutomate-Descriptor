import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw, Download, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { generateMermaidDiagram } from '../utils/mermaidGenerator';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
    curve: 'basis'
  }
});

export function FlowDiagram({ analyzedFlow, onSelectAction }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState(null);

  const mermaidCode = generateMermaidDiagram(analyzedFlow);

  useEffect(() => {
    let isMounted = true;
    setRenderError(null);

    const renderDiagram = async () => {
      try {
        const id = `mermaid-id-${Math.floor(Math.random() * 100000)}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setRenderError('Не вдалося згенерувати графічну діаграму для цього потоку.');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [mermaidCode]);

  // Click handler on SVG nodes
  const handleContainerClick = (e) => {
    const nodeEl = e.target.closest('.node');
    if (nodeEl) {
      const idAttr = nodeEl.id || '';
      // ID pattern: Act_Action_Name or Trg_Trigger_Name
      if (idAttr.includes('Act_')) {
        const rawName = idAttr.replace(/^.*Act_/, '').replace(/_[0-9]+$/, '');
        const actionObj = analyzedFlow.actionsList.find(
          a => a.name.replace(/[^a-zA-Z0-9_]/g, '_') === rawName || a.name === rawName
        );
        if (actionObj) {
          onSelectAction(actionObj);
        }
      }
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4));
  const handleResetZoom = () => setZoom(1);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analyzedFlow.displayName || 'power-automate-flow'}-schema.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="diagram-view">
      <div className="diagram-toolbar">
        <div className="toolbar-group">
          <button className="btn btn-icon" onClick={handleZoomIn} title="Збільшити">
            <ZoomIn size={18} />
          </button>
          <button className="btn btn-icon" onClick={handleZoomOut} title="Зменшити">
            <ZoomOut size={18} />
          </button>
          <button className="btn btn-icon" onClick={handleResetZoom} title="Скинути масштаб">
            <RotateCcw size={18} />
          </button>
          <span className="zoom-badge">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="toolbar-group">
          <button className="btn btn-ghost" onClick={handleCopyCode}>
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            <span>{copied ? 'Скопійовано!' : 'Копіювати Mermaid код'}</span>
          </button>
          <button className="btn btn-primary" onClick={handleDownloadSVG}>
            <Download size={16} />
            <span>Завантажити SVG</span>
          </button>
        </div>
      </div>

      {renderError ? (
        <div className="error-box">
          <p>{renderError}</p>
        </div>
      ) : (
        <div className="diagram-canvas-container" onClick={handleContainerClick}>
          <div 
            ref={containerRef} 
            className="mermaid-viewport"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      )}
    </div>
  );
}
