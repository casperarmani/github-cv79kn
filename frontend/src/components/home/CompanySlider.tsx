import React from 'react';

export function CompanySlider() {
  return (
    <div className="relative">
      <div className="flex space-x-32 animate-scroll">
        <div className="flex space-x-32 min-w-full">
          {/* First set of logos */}
          <div className="flex items-center justify-center w-48 h-16">
            <div className="text-white/60 font-light text-2xl">Netflix</div>
          </div>
          <div className="flex items-center justify-center w-48 h-16">
            <div className="text-white/60 font-light text-2xl">Disney+</div>
          </div>
          <div className="flex items-center justify-center w-48 h-16">
            <div className="text-white/60 font-light text-2xl">Amazon</div>
          </div>
          <div className="flex items-center justify-center w-48 h-16">
            <div className="text-white/60 font-light text-2xl">HBO</div>
          </div>
          <div className="flex items-center justify-center w-48 h-16">
            <div className="text-white/60 font-light text-2xl">YouTube</div>
          </div>
        </div>
        {/* Duplicate set for seamless loop */}
        <div className="flex space-x-32 min-w-full">
          <div className="flex items-center justify-center w-48 h-16">
            <div className="text-white/60 font-light text-2xl">Netflix</div>
          </div>
          <div className="flex items-center justify-center w-48 h-16">
            <div className="text-white/60 font-light text-2xl">Disney+</div>
          </div>
          <div className="flex items-center justify-center w-48 h-16">
            <div className="text-white/60 font-light text-2xl">Amazon</div>
          </div>
          <div className="flex items-center justify-center w-48 h-16">
            <div className="text-white/60 font-light text-2xl">HBO</div>
          </div>
          <div className="flex items-center justify-center w-48 h-16">
            <div className="text-white/60 font-light text-2xl">YouTube</div>
          </div>
        </div>
      </div>
    </div>
  );
}