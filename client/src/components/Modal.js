// src/components/Modal.js
import React from 'react';
import './Modal.css';   // ← 여기
export default function Modal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="modal-close" onClick={onClose}>&times;</span>
        {title && <h2 style={{ marginBottom: '16px' }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}
