import React from 'react';

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className={`bg-gray-lighter rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in fade-in zoom-in duration-200`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-light bg-white">
          <h2 className="text-xl font-bold text-dark">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 bg-white border-t border-gray-light flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
