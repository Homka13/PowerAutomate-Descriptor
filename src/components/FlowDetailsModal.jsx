import React from 'react';
import { X, Code, Terminal, ArrowRight, ShieldAlert } from 'lucide-react';

export function FlowDetailsModal({ action, onClose }) {
  if (!action) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Code className="text-primary" size={20} />
            <h3>Деталі дії: {action.name}</h3>
          </div>
          <button className="btn btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="info-row">
            <span className="info-label">Тип дії (Type):</span>
            <span className="badge badge-type">{action.type}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Категорія:</span>
            <span className="badge">{action.typeCategory}</span>
          </div>

          {action.runsOnFailure && (
            <div className="alert-badge alert-error">
              <ShieldAlert size={16} />
              <span>Ця дія спрацьовує при ПОМИЛЦІ або таймауті попереднього кроку (On Error Branch).</span>
            </div>
          )}

          {action.expression && (
            <div className="code-block-wrapper">
              <span className="code-title">Умова / Вираз (Expression):</span>
              <pre className="code-snippet">{action.expression}</pre>
            </div>
          )}

          {action.inputs && (
            <div className="code-block-wrapper">
              <span className="code-title">Вхідні параметри (Inputs JSON):</span>
              <pre className="code-snippet">{JSON.stringify(action.inputs, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
