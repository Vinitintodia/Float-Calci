
import React from 'react';
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const GlassCard = ({ 
  children, 
  className, 
  intensity = 'medium',
  ...props 
}: GlassCardProps) => {
  
  const intensityClasses = {
    low: 'bg-white/30 backdrop-blur-sm border-white/10',
    medium: 'bg-white/50 backdrop-blur-md border-white/20',
    high: 'bg-white/70 backdrop-blur-lg border-white/30'
  };
  
  return (
    <div 
      className={cn(
        "rounded-2xl border shadow-sm transition-all duration-300", 
        intensityClasses[intensity],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
