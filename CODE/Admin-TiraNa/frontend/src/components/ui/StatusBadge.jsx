import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStyles = (s) => {
    const statusLower = s?.toLowerCase();
    
    // Brand Success/Active
    if (['active', 'approved', 'completed', 'confirmed', 'verified'].includes(statusLower)) {
      return 'bg-brand/10 text-brand';
    }
    
    // Pending/Yellow
    if (['pending', 'waiting'].includes(statusLower)) {
      return 'bg-yellow-100 text-yellow-700';
    }
    
    // Red/Error
    if (['rejected', 'suspended', 'cancelled', 'failed', 'hidden'].includes(statusLower)) {
      return 'bg-red-100 text-red-600';
    }
    
    // Default Gray
    return 'bg-gray-light text-dark';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStyles(status)}`}>
      {status}
    </span>
  );
};
