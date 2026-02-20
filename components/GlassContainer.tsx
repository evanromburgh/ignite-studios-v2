
import React from 'react';

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`liquid-glass rounded-xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
};
