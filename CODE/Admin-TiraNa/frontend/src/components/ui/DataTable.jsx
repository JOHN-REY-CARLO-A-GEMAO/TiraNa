import React from 'react';
import { Spinner } from './Spinner';

export const DataTable = ({ 
  headers, 
  data, 
  loading, 
  emptyMessage = 'No results found.',
  renderRow 
}) => {
  return (
    <div className="bg-gray-lighter rounded-xl shadow-sm border border-gray-light overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-light border-b border-gray-light">
                {headers.map((header, i) => (
                  <th 
                    key={i} 
                    className={`px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider ${header.className || 'text-left'}`}
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-light bg-white">
              {data.map((item, i) => renderRow(item, i))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
