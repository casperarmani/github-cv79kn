import React from 'react';

export function ChatHeader() {
  return (
    <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
      <div className="flex space-x-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <div className="flex space-x-8 text-white/60 text-sm font-light">
        <span className="text-white">1. Data Pipeline</span>
        <span>2. Collect Data</span>
        <span>3. Train Model</span>
      </div>
    </div>
  );
}