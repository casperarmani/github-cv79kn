import { Brain } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface ModelCardProps {
  name: string;
  size: string;
  type: string;
}

export function ModelCard({ name, size, type }: ModelCardProps) {
  return (
    <GlassCard className="group relative overflow-hidden hover:border-gray-200 transition-all duration-300">
      <div className="p-4 flex items-center space-x-3">
        <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center">
          <Brain className="h-5 w-5 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-800 truncate">{name}</h3>
          <p className="text-xs text-gray-500">
            {size} • {type}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}