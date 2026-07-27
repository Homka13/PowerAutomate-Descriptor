import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Share2, Layers, Cpu, AlertTriangle } from 'lucide-react';
import { generateMarkdownDoc } from '../utils/docGenerator';

export function FlowDocumentation({ analyzedFlow }) {
  const [copied, setCopied] = useState(false);
  const markdownText = generateMarkdownDoc(analyzedFlow);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analyzedFlow.displayName || 'power-automate-flow'}-documentation.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="doc-view">
      <div className="doc-header">
        <div className="doc-metrics">
          <div className="metric-card">
            <Cpu className="metric-icon text-primary" size={20} />
            <div className="metric-info">
              <span className="metric-value">{analyzedFlow.summary.totalActions}</span>
              <span className="metric-label">Дій всього</span>
            </div>
          </div>

          <div className="metric-card">
            <Layers className="metric-icon text-accent" size={20} />
            <div className="metric-info">
              <span className="metric-value">{analyzedFlow.summary.controlFlowCount}</span>
              <span className="metric-label">Блоків логіки</span>
            </div>
          </div>

          <div className="metric-card">
            <Share2 className="metric-icon text-info" size={20} />
            <div className="metric-info">
              <span className="metric-value">{analyzedFlow.connectors.length}</span>
              <span className="metric-label">Коннекторів</span>
            </div>
          </div>

          <div className="metric-card">
            <AlertTriangle className={`metric-icon ${analyzedFlow.summary.hasErrorHandling ? 'text-success' : 'text-warning'}`} size={20} />
            <div className="metric-info">
              <span className="metric-value">{analyzedFlow.summary.hasErrorHandling ? 'Включено' : 'Базова'}</span>
              <span className="metric-label">Обробка помилок</span>
            </div>
          </div>
        </div>

        <div className="doc-actions">
          <button className="btn btn-ghost" onClick={handleCopyMarkdown}>
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            <span>{copied ? 'Скопійовано!' : 'Скопіювати Markdown'}</span>
          </button>
          <button className="btn btn-primary" onClick={handleDownloadMarkdown}>
            <Download size={16} />
            <span>Завантажити .MD файл</span>
          </button>
        </div>
      </div>

      <div className="markdown-paper">
        <pre className="markdown-render-raw">{markdownText}</pre>
      </div>
    </div>
  );
}
