import React from 'react';

export const Select = ({ value, onChange, options, placeholder, className = '' }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`px-4 py-2 bg-white border border-gray-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all cursor-pointer ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};
