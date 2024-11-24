import React from 'react';
import { GlassCard } from './GlassCard';
import { UseCase } from './MetricsBanner';
import { Play } from 'lucide-react';

interface UseCaseDemoProps {
  useCase: UseCase;
}

const demoContent = {
  roas: {
    video: "https://your-cdn.com/roas-demo.gif",
    title: "Inconsistent ROAS/Performance",
    description: "The biggest pain point for marketers. Get reliable, predictable results with AI-powered analysis that ensures consistent performance across all campaigns."
  },
  research: {
    video: "https://your-cdn.com/research-demo.gif",
    title: "Time Waste on Research",
    description: "Transform weeks of competitor research into minutes. Our AI analyzes thousands of competitor ads instantly, saving you countless hours of manual work."
  },
  scale: {
    video: "https://your-cdn.com/scale-demo.gif",
    title: "Scaling Winners",
    description: "Finding winning ads is hard, but replicating success reliably is even harder. Our AI understands why ads work and generates proven variations that maintain performance."
  },
  creation: {
    video: "https://your-cdn.com/creation-demo.gif",
    title: "Guesswork in Creation",
    description: "Replace gut feelings with data-driven decisions. Get concrete insights into what drives conversions, backed by analysis of millions in ad spend."
  },
  trends: {
    video: "https://your-cdn.com/trends-demo.gif",
    title: "Missing Trends",
    description: "Stop being reactive and start being proactive with trends. Spot emerging opportunities before your competitors and understand exactly why they work."
  }
};

export function UseCaseDemo({ useCase }: UseCaseDemoProps) {
  const content = demoContent[useCase];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <GlassCard className="p-8">
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          
          <div>
            <h3 className="text-2xl font-light text-white mb-2">{content.title}</h3>
            <p className="text-white/60">{content.description}</p>
          </div>

          <div className="aspect-video bg-black/20 rounded-xl overflow-hidden relative group">
            <img 
              src={content.video} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-16 h-16 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-white/60 text-sm mb-1">Time Saved</div>
              <div className="text-white text-lg font-medium">95%</div>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-white/60 text-sm mb-1">ROAS Increase</div>
              <div className="text-white text-lg font-medium">2-4x</div>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-white/60 text-sm mb-1">Success Rate</div>
              <div className="text-white text-lg font-medium">90%+</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}