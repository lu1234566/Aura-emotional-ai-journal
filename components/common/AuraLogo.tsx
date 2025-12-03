
import React from 'react';

export const AuraLogo = ({ className = "" }: { className?: string }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="20" cy="20" r="10" stroke="url(#p0)" strokeWidth="1.5"/>
    <path d="M20 4C11.1634 4 4 11.1634 4 20C4 28.8366 11.1634 36 20 36" stroke="url(#p1)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4"/>
    <path d="M36 20C36 11.1634 28.8366 4 20 4" stroke="url(#p2)" strokeWidth="1.5" strokeLinecap="round"/>
    <defs>
      <linearGradient id="p0" x1="10" y1="20" x2="30" y2="20" gradientUnits="userSpaceOnUse"><stop stopColor="#06B6D4"/><stop offset="1" stopColor="#D946EF"/></linearGradient>
      <linearGradient id="p1" x1="4" y1="20" x2="20" y2="20" gradientUnits="userSpaceOnUse"><stop stopColor="#D946EF" stopOpacity="0"/><stop offset="1" stopColor="#D946EF"/></linearGradient>
      <linearGradient id="p2" x1="36" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse"><stop stopColor="#06B6D4"/><stop offset="1" stopColor="#06B6D4" stopOpacity="0"/></linearGradient>
    </defs>
  </svg>
);
