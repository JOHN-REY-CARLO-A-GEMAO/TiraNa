import React from 'react';

export const Card = ({ children, title, subtitle, className = '', footer }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-light overflow-hidden hover:shadow-md transition-shadow ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-lighter">
          {title && <h3 className="text-lg font-bold text-dark">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-gray-lighter border-t border-gray-light">
          {footer}
        </div>
      )}
    </div>
  );
};
