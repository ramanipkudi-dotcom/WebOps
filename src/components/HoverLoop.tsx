import React from 'react';

interface HoverLoopProps {
  children: React.ReactNode;
  className?: string;
}

export const HoverLoop: React.FC<HoverLoopProps> = ({ children, className = '' }) => {
  return (
    <div className={`hover-loop up ${className}`}>
      <span className="inner first">{children}</span>
      <span className="inner second" aria-hidden="true">{children}</span>
    </div>
  );
};
