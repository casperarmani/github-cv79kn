import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart4, 
  Search, 
  Rocket, 
  FileBarChart2, 
  LineChart,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type UseCase = 'roas' | 'research' | 'scale' | 'creation' | 'trends';

const useCases = [
  {
    id: 'roas',
    title: 'Consistent ROAS/Performance',
    description: 'The biggest pain point for marketers. Get reliable, predictable results with AI-powered analysis that ensures consistent performance across all campaigns.',
    icon: BarChart4,
    image: 'https://cdn.discordapp.com/attachments/1109371168147914752/1308986838710620191/Screenshot_2024-11-15_at_22.11.17.png?ex=673ff07e&is=673e9efe&hm=0191172404aee32a0af9c8cf4f51f3c833963b59db55e27ed15b02a59b65cdd5&'
  },
  {
    id: 'research',
    title: 'Competitor Research In Minutes',
    description: 'Transform weeks of competitor research into minutes. Our AI analyzes thousands of competitor ads instantly, saving you countless hours of manual work.',
    icon: Search,
    image: 'https://cdn.discordapp.com/attachments/1109371168147914752/1308986838710620191/Screenshot_2024-11-15_at_22.11.17.png?ex=673ff07e&is=673e9efe&hm=0191172404aee32a0af9c8cf4f51f3c833963b59db55e27ed15b02a59b65cdd5&'
  },
  {
    id: 'scale',
    title: 'Scale Winning Ads',
    description: 'Finding winning ads is hard, but replicating success reliably is even harder. Our AI understands why ads work and generates proven variations that maintain performance.',
    icon: Rocket,
    image: 'https://cdn.discordapp.com/attachments/1109371168147914752/1308986838710620191/Screenshot_2024-11-15_at_22.11.17.png?ex=673ff07e&is=673e9efe&hm=0191172404aee32a0af9c8cf4f51f3c833963b59db55e27ed15b02a59b65cdd5&'
  },
  {
    id: 'creation',
    title: 'Breakdown Losing Ads',
    description: 'Replace gut feelings with data-driven decisions. Get concrete insights into what drives conversions, backed by analysis of millions in ad spend.',
    icon: FileBarChart2,
    image: 'https://cdn.discordapp.com/attachments/1109371168147914752/1308986838710620191/Screenshot_2024-11-15_at_22.11.17.png?ex=673ff07e&is=673e9efe&hm=0191172404aee32a0af9c8cf4f51f3c833963b59db55e27ed15b02a59b65cdd5&'
  },
  {
    id: 'trends',
    title: 'Spot Trends Before Competitors',
    description: 'Stop being reactive and start being proactive with trends. Spot emerging opportunities before your competitors and understand exactly why they work.',
    icon: LineChart,
    image: 'https://cdn.discordapp.com/attachments/1109371168147914752/1308986838710620191/Screenshot_2024-11-15_at_22.11.17.png?ex=673ff07e&is=673e9efe&hm=0191172404aee32a0af9c8cf4f51f3c833963b59db55e27ed15b02a59b65cdd5&'
  }
];

const CYCLE_DURATION = 15000; // 15 seconds
const PAUSE_DURATION = 180000; // 3 minutes

export function MetricsBanner() {
  const [activeCase, setActiveCase] = useState(useCases[0]);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseTimeout, setPauseTimeout] = useState<NodeJS.Timeout | null>(null);

  const getCurrentIndex = useCallback(() => {
    return useCases.findIndex(useCase => useCase.id === activeCase.id);
  }, [activeCase.id]);

  const cycleToNextCase = useCallback(() => {
    if (!isPaused) {
      const currentIndex = getCurrentIndex();
      const nextIndex = (currentIndex + 1) % useCases.length;
      setActiveCase(useCases[nextIndex]);
      setProgress(0);
    }
  }, [getCurrentIndex, isPaused]);

  const handleManualSelect = (useCase: typeof useCases[0]) => {
    setActiveCase(useCase);
    setProgress(0);
    setIsPaused(true);
    
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
    }
    
    const timeout = setTimeout(() => {
      setIsPaused(false);
    }, PAUSE_DURATION);
    
    setPauseTimeout(timeout);
  };

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev >= 100) {
            cycleToNextCase();
            return 0;
          }
          return prev + (100 / (CYCLE_DURATION / 100));
        });
      }
    }, 100);

    return () => {
      clearInterval(progressInterval);
      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
      }
    };
  }, [cycleToNextCase, isPaused, pauseTimeout]);

  return (
    <section className="py-20 relative">
      <div className="max-w-[90rem] mx-auto px-6">
        <h2 className="text-5xl font-light text-center mb-16">
          Make Every Ad As Profitable As Your Best
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-16 items-start">
          {/* Left Column - Content */}
          <div className="space-y-4">
            {useCases.map((useCase) => (
              <div
                key={useCase.id}
                className={cn(
                  "rounded-xl transition-all duration-300 cursor-pointer overflow-hidden",
                  activeCase.id === useCase.id
                    ? "bg-black/5 shadow-lg"
                    : "hover:bg-black/5"
                )}
                onClick={() => handleManualSelect(useCase)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <useCase.icon className="w-6 h-6 text-gray-600" />
                      </div>
                      <h3 className="text-xl font-medium">{useCase.title}</h3>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5 text-gray-400 transition-transform duration-300",
                      activeCase.id === useCase.id ? "rotate-90" : ""
                    )} />
                  </div>

                  {/* Progress bar */}
                  {activeCase.id === useCase.id && !isPaused && (
                    <div className="mt-4 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gray-600 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {/* Expandable Content */}
                  <div className={cn(
                    "grid transition-all duration-300",
                    activeCase.id === useCase.id 
                      ? "grid-rows-[1fr] opacity-100 mt-4" 
                      : "grid-rows-[0fr] opacity-0"
                  )}>
                    <div className="overflow-hidden">
                      <p className="text-gray-600 leading-relaxed">
                        {useCase.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Image */}
          <div className="sticky top-24">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-[3/2] w-full">
                <img
                  src={activeCase.image}
                  alt={activeCase.title}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}