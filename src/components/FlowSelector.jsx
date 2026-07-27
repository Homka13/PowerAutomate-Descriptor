import React from 'react';
import { Workflow } from 'lucide-react';

export function FlowSelector({ flows, selectedFlowIndex, onSelectFlow }) {
  if (flows.length <= 1) return null;

  return (
    <div className="flow-selector-bar">
      <span className="selector-title">
        <Workflow size={16} />
        Знайдені потоки у пакеті ({flows.length}):
      </span>
      <div className="flow-tabs">
        {flows.map((f, idx) => (
          <button
            key={f.id || idx}
            className={`tab-btn ${idx === selectedFlowIndex ? 'active' : ''}`}
            onClick={() => onSelectFlow(idx)}
          >
            {f.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
