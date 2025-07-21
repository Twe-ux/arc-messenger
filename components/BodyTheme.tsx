'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';

export function BodyTheme() {
  const { backgroundColor, isLoaded } = useTheme();

  useEffect(() => {
    // Apply backgroundColor immediately, even before context is loaded
    if (typeof document !== 'undefined') {
      // Set CSS custom property - this will update the CSS variable
      document.documentElement.style.setProperty('--app-background-color', backgroundColor);
      
      // Force apply directly to body and html immediately
      document.body.style.backgroundColor = backgroundColor;
      document.documentElement.style.backgroundColor = backgroundColor;
    }
  }, [backgroundColor]);

  // Apply immediately on mount to prevent flash
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Apply current backgroundColor immediately
      document.body.style.backgroundColor = backgroundColor;
      document.documentElement.style.backgroundColor = backgroundColor;
    }
  }, []);

  // This component doesn't render anything
  return null;
}