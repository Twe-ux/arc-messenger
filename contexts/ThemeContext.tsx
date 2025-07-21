'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  text: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  border: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  currentTheme: string;
  setTheme: (theme: string) => void;
  availableThemes: { [key: string]: ThemeColors };
  addCustomTheme: (name: string, colors: ThemeColors) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  sidebarPosition: 'left' | 'right';
  setSidebarPosition: (position: 'left' | 'right') => void;
  isLoaded: boolean;
}

const arcThemes = {
  'arc-purple': {
    primary: '#8b5cf6', // Arc's signature purple
    primaryHover: '#7c3aed',
    primaryLight: '#faf5ff',
    primaryDark: '#581c87',
    text: '#6b21a8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
  },
  'arc-violet': {
    primary: '#6366f1', // Arc variant
    primaryHover: '#4f46e5',
    primaryLight: '#eef2ff',
    primaryDark: '#312e81',
    text: '#4338ca',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
  },
  'arc-blue': {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryLight: '#eff6ff',
    primaryDark: '#1e3a8a',
    text: '#1d4ed8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
  },
  'arc-teal': {
    primary: '#14b8a6',
    primaryHover: '#0d9488',
    primaryLight: '#f0fdfa',
    primaryDark: '#134e4a',
    text: '#0f766e',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
  },
  'arc-pink': {
    primary: '#ec4899',
    primaryHover: '#db2777',
    primaryLight: '#fdf2f8',
    primaryDark: '#831843',
    text: '#be185d',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
  },
  'arc-green': {
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: '#ecfdf5',
    primaryDark: '#064e3b',
    text: '#047857',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
  },
};

const arcDarkThemes = {
  'arc-purple-dark': {
    primary: '#a855f7',
    primaryHover: '#9333ea',
    primaryLight: '#1e1b4b',
    primaryDark: '#581c87',
    text: '#c4b5fd',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    background: '#0f0f23',
    surface: '#1e1b4b',
    border: '#312e81',
  },
  'arc-violet-dark': {
    primary: '#8b5fbf',
    primaryHover: '#7c3aed',
    primaryLight: '#1e1b4b',
    primaryDark: '#312e81',
    text: '#a78bfa',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    background: '#0f0f23',
    surface: '#1e1b4b',
    border: '#312e81',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState('arc-purple');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [customThemes, setCustomThemes] = useState<{ [key: string]: ThemeColors }>({});
  const [backgroundColor, setBackgroundColor] = useState('rgb(216, 180, 254)');
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme and preferences from localStorage
  useEffect(() => {
    // Batch all synchronous operations
    const savedTheme = localStorage.getItem('arc-messenger-theme');
    const savedDarkMode = localStorage.getItem('arc-messenger-dark-mode');
    const savedCustomThemes = localStorage.getItem('arc-messenger-custom-themes');
    const savedBackgroundColor = localStorage.getItem('arc-messenger-background-color');
    const savedSidebarPosition = localStorage.getItem('arc-messenger-sidebar-position');

    // Load custom themes first
    if (savedCustomThemes) {
      try {
        setCustomThemes(JSON.parse(savedCustomThemes));
      } catch (error) {
        console.error('Error loading custom themes:', error);
      }
    }

    // Load all preferences synchronously
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }

    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    } else {
      // Auto-detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }

    if (savedBackgroundColor) {
      setBackgroundColor(savedBackgroundColor);
    }

    if (savedSidebarPosition) {
      setSidebarPosition(savedSidebarPosition as 'left' | 'right');
    }
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      setIsLoaded(true);
    });
  }, []);

  // Save preferences to localStorage (only after initial load)
  useEffect(() => {
    if (!isLoaded) return; // Don't save during initial load
    
    localStorage.setItem('arc-messenger-theme', currentTheme);
    localStorage.setItem('arc-messenger-dark-mode', JSON.stringify(isDarkMode));
    localStorage.setItem('arc-messenger-background-color', backgroundColor);
    localStorage.setItem('arc-messenger-sidebar-position', sidebarPosition);
  }, [currentTheme, isDarkMode, backgroundColor, sidebarPosition, isLoaded]);

  // Save custom themes to localStorage
  useEffect(() => {
    localStorage.setItem('arc-messenger-custom-themes', JSON.stringify(customThemes));
  }, [customThemes]);

  const addCustomTheme = (name: string, colors: ThemeColors) => {
    setCustomThemes(prev => ({
      ...prev,
      [name]: colors
    }));
  };

  const setTheme = (theme: string) => {
    const allThemes: { [key: string]: ThemeColors } = { ...arcThemes, ...arcDarkThemes, ...customThemes };
    if (allThemes[theme]) {
      setCurrentTheme(theme);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleSetBackgroundColor = (color: string) => {
    setBackgroundColor(color);
    // Apply immediately to prevent flash
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = color;
      document.documentElement.style.backgroundColor = color;
    }
  };

  // Get current theme colors
  const getCurrentColors = (): ThemeColors => {
    const allLightThemes: { [key: string]: ThemeColors } = { ...arcThemes, ...customThemes };
    const allDarkThemes: { [key: string]: ThemeColors } = { ...arcDarkThemes, ...customThemes };
    
    if (isDarkMode) {
      const darkThemeName = currentTheme.includes('-dark') ? currentTheme : `${currentTheme}-dark`;
      return allDarkThemes[darkThemeName] || arcDarkThemes['arc-purple-dark'];
    }
    
    const lightThemeName = currentTheme.replace('-dark', '');
    return allLightThemes[lightThemeName] || arcThemes['arc-purple'];
  };

  const allAvailableThemes = { ...arcThemes, ...arcDarkThemes, ...customThemes };

  return (
    <ThemeContext.Provider value={{
      colors: getCurrentColors(),
      currentTheme,
      setTheme,
      availableThemes: allAvailableThemes,
      addCustomTheme,
      isDarkMode,
      toggleDarkMode,
      backgroundColor,
      setBackgroundColor: handleSetBackgroundColor,
      sidebarPosition,
      setSidebarPosition,
      isLoaded,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}