import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-black/20 backdrop-blur-xl border border-white/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}