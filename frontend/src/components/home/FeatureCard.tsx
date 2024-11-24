import { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <GlassCard className="p-6 hover:border-gray-200 transition-all duration-300">
      <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </GlassCard>
  );
}