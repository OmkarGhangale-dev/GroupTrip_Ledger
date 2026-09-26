import React from "react";

export default function GlassCard({ children, className = "", variant = "default", onClick, style = {} }) {
  return (
    <div 
      className={`glass-card glass-${variant} ${className}`} 
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
