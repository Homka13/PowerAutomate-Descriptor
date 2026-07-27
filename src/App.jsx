import React, { useState } from 'react';
import { 
  FileArchive, 
  GitFork, 
  FileText, 
  Code2, 
  RefreshCw, 
  Workflow, 
  Sparkles, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { FlowSelector } from './components/FlowSelector';
import { FlowDiagram } from './components/FlowDiagram';
import { FlowDocumentation } from './components/FlowDocumentation';
import { FlowDetailsModal } from './components/FlowDetailsModal';
import { parsePowerAutomatePackage } from './utils/zipParser';
import { analyzeFlow } from './utils/flowParser';
import { SAMPLE_POWER_AUTOMATE_FLOW } from './utils/sampleFlow';

export function App() {
  const [parsedFlows, setParsedFlows] = useState(null);
  const [selectedFlowIdx, setSelectedFlowIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('diagram'); // 'diagram' | 'doc' | 'raw'
  const [selectedAction, setSelectedAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const flows = await parsePowerAutomatePackage(file);
      setParsedFlows(flows);
      setSelectedFlowIdx(0);
      setActiveTab('diagram');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Помилка при розборі ZIP-архіву.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    setLoading(true);
    setTimeout(() => {
      setParsedFlows([SAMPLE_POWER_AUTOMATE_FLOW]);
      setSelectedFlowIdx(0);
      setActiveTab('diagram');
      setLoading(false);
    }, 400);
  };

  const handleReset = () => {
    setParsedFlows(null);
    setSelectedFlowIdx(0);
    setSelectedAction(null);
    setError(null);
  };

  const currentFlow = parsedFlows ? parsedFlows[selectedFlowIdx] : null;
  const analyzedFlow = currentFlow ? analyzeFlow(currentFlow) : null;

  return (
    <div className="app-layout">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-brand" onClick={handleReset}>
          <div className="logo-icon">
            <Zap className="logo-svg" size={24} />
          </div>
          <div>
            <h1>Power Automate Visualizer</h1>
            <span className="brand-subtitle">Аналізатор та Генератор Схем / Документації</span>
          </div>
        </div>

        {parsedFlows && (
          <div className="header-actions">
            <button className="btn btn-ghost" onClick={handleReset}>
              <RefreshCw size={16} />
              <span>Завантажити інший архів</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        {loading && (
          <div className="loading-screen">
            <div className="spinner"></div>
            <p>Аналізуємо структуру архіву та Power Automate логіку...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <div className="error-card">
              <h3>Помилка розпакування</h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={handleReset}>Спробувати знову</button>
            </div>
          </div>
        )}

        {!loading && !error && !parsedFlows && (
          <FileUpload 
            onFileSelect={handleFileSelect} 
            onLoadSample={handleLoadSample} 
          />
        )}

        {!loading && !error && parsedFlows && analyzedFlow && (
          <div className="workspace">
            {/* Flow Selector Bar (for multi-flow archives) */}
            <FlowSelector 
              flows={parsedFlows} 
              selectedFlowIndex={selectedFlowIdx} 
              onSelectFlow={setSelectedFlowIdx} 
            />

            {/* Navigation Tabs */}
            <div className="workspace-tabs-bar">
              <div className="tabs">
                <button 
                  className={`tab ${activeTab === 'diagram' ? 'active' : ''}`}
                  onClick={() => setActiveTab('diagram')}
                >
                  <GitFork size={18} />
                  <span>Графічна Схема (Diagram)</span>
                </button>
                <button 
                  className={`tab ${activeTab === 'doc' ? 'active' : ''}`}
                  onClick={() => setActiveTab('doc')}
                >
                  <FileText size={18} />
                  <span>Опис та Документація (.MD)</span>
                </button>
                <button 
                  className={`tab ${activeTab === 'raw' ? 'active' : ''}`}
                  onClick={() => setActiveTab('raw')}
                >
                  <Code2 size={18} />
                  <span>Raw JSON</span>
                </button>
              </div>

              <div className="flow-title-badge">
                <Workflow size={16} className="text-primary" />
                <span>{analyzedFlow.displayName}</span>
              </div>
            </div>

            {/* View Tab Contents */}
            <div className="tab-content">
              {activeTab === 'diagram' && (
                <FlowDiagram 
                  analyzedFlow={analyzedFlow} 
                  onSelectAction={setSelectedAction} 
                />
              )}

              {activeTab === 'doc' && (
                <FlowDocumentation 
                  analyzedFlow={analyzedFlow} 
                />
              )}

              {activeTab === 'raw' && (
                <div className="raw-json-view">
                  <pre className="code-snippet">{currentFlow.rawText}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Action Details Modal */}
      {selectedAction && (
        <FlowDetailsModal 
          action={selectedAction} 
          onClose={() => setSelectedAction(null)} 
        />
      )}
    </div>
  );
}
