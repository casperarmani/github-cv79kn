import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { GlassCard } from './GlassCard';

export function DemoSection() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <GlassCard className="p-8">
          <div className="flex items-center space-x-4 mb-6">
            <Calendar className="w-8 h-8 text-gray-600" />
            <h3 className="text-2xl font-light text-gray-800">Schedule a Demo</h3>
          </div>
          <p className="text-gray-600 mb-8">
            Get a personalized walkthrough of our enterprise features and learn how we can help scale your video analysis.
          </p>
          <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white">
            Book a Demo Call
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </GlassCard>

        <GlassCard className="p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="text-sm font-medium text-gray-800">Basic</div>
                <div className="text-xs text-gray-600">For individuals</div>
              </div>
              <Button variant="ghost" className="text-gray-600">
                Start Free
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="text-sm font-medium text-gray-800">Pro</div>
                <div className="text-xs text-gray-600">For teams</div>
              </div>
              <Button variant="ghost" className="text-gray-600">
                Try Pro
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="text-sm font-medium text-gray-800">Enterprise</div>
                <div className="text-xs text-gray-600">Custom solutions</div>
              </div>
              <Button variant="ghost" className="text-gray-600">
                Contact Sales
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}