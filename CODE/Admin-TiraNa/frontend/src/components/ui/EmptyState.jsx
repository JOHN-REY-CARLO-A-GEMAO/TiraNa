import React from 'react';

export const EmptyState = ({ message, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      {icon ? (
        <div className="mb-4">{icon}</div>
      ) : (
        <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 8-8-8" />
        </svg>
      )}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};
