import React from 'react';
import { Play, PauseCircle } from 'lucide-react';
import { GlassCard } from './GlassCard';

export function VideoDemo() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <GlassCard className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden group">
            <video
              className="w-full h-full object-cover"
              poster="/demo-thumbnail.jpg"
              muted
              loop
            >
              <source src="/demo-video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-16 h-16 text-white" />
            </div>
            <div className="absolute bottom-4 left-4 text-sm text-white">Original Video</div>
          </div>
          
          <div className="relative aspect-video bg-gray-50 rounded-xl overflow-hidden">
            <div className="absolute inset-0 p-4">
              <div className="h-full overflow-auto">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="text-sm text-gray-600">Analyzing content...</div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-800">Object Detection</div>
                      <div className="text-xs text-gray-600">Person (99%), Car (95%), Building (90%)</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-800">Scene Analysis</div>
                      <div className="text-xs text-gray-600">Urban environment, Daytime, Clear weather</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 text-sm text-gray-600">AI Analysis</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}