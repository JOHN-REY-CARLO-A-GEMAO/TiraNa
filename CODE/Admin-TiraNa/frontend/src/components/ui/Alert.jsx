import React from 'react';

export const Alert = ({ type = 'error', children, className = '' }) => {
  const styles = {
    error: 'bg-brand/10 border-brand/30 text-brand',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={`p-4 border rounded-xl text-sm font-medium ${styles[type]} ${className}`}>
      {children}
    </div>
  );
};
