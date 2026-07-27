import React, { useState } from 'react';
import { UploadCloud, FileCode, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export function FileUpload({ onFileSelect, onLoadSample }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcess(files[0]);
    }
  };

  const handleFileInput = (e) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const validateAndProcess = (file) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.zip') && !name.endsWith('.json')) {
      setError('Будь ласка, оберіть файл формату .ZIP або .JSON');
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="upload-container">
      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="icon-wrapper">
          <UploadCloud className="upload-icon" size={48} />
        </div>

        <h2>Перетягніть ZIP-архів з потоком Power Automate</h2>
        <p className="upload-subtitle">
          Підтримуються класичні експорти `.zip`, розплановані рішення Power Apps Solution `.zip` або окремі `.json` файли.
        </p>

        <label className="btn btn-primary btn-large">
          <FileCode size={20} />
          <span>Обрати ZIP файл з комп'ютера</span>
          <input 
            type="file" 
            accept=".zip,.json" 
            onChange={handleFileInput} 
            style={{ display: 'none' }} 
          />
        </label>

        {error && (
          <div className="error-badge">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="privacy-notice">
          <CheckCircle2 size={16} className="text-success" />
          <span>100% Локально та безпечно: ваші файли обробляються виключно у браузері без відправки на сервер.</span>
        </div>

        <div className="sample-flow-container">
          <button className="btn btn-ghost" onClick={onLoadSample}>
            <Sparkles size={16} className="text-warning" />
            <span>Завантажити тестовий потік для демонстрації</span>
          </button>
        </div>
      </div>
    </div>
  );
}
