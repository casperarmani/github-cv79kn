import React from 'react';

export function ChatWelcome() {
  return (
    <div className="px-6 py-8">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-8 h-2 bg-white/20 rounded-full" />
        <span className="text-white/80 text-xl font-light">Video Analysis AI</span>
      </div>
      <h1 className="text-white text-4xl font-extralight leading-tight">
        Welcome! How would you like to get started?
      </h1>
    </div>
  );
}