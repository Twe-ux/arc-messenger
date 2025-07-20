# Design System Complet - Messaging App

## 1. Fondations du Design

### 1.1 Philosophie de Design

**Principes directeurs :**

- **Minimalisme fonctionnel** : Interface épurée inspirée d'Arc Browser
- **Familiarité** : Patterns de messagerie inspirés de WhatsApp
- **Fluidité** : Animations et transitions douces
- **Accessibilité** : WCAG 2.1 AA compliant
- **Adaptabilité** : Design responsive et thèmes personnalisables

### 1.2 Grille et Espacement

```scss
// _spacing.scss
$spacing-unit: 8px;

$spacing: (
  0: 0,
  1: $spacing-unit * 0.25,
  // 2px
  2: $spacing-unit * 0.5,
  // 4px
  3: $spacing-unit * 0.75,
  // 6px
  4: $spacing-unit,
  // 8px
  5: $spacing-unit * 1.5,
  // 12px
  6: $spacing-unit * 2,
  // 16px
  7: $spacing-unit * 2.5,
  // 20px
  8: $spacing-unit * 3,
  // 24px
  9: $spacing-unit * 4,
  // 32px
  10: $spacing-unit * 5,
  // 40px
  11: $spacing-unit * 6,
  // 48px
  12: $spacing-unit * 8,
  // 64px
);

// Grille
$grid-columns: 12;
$grid-gutter: map-get($spacing, 6);
$container-max-widths: (
  sm: 640px,
  md: 768px,
  lg: 1024px,
  xl: 1280px,
  2xl: 1536px,
);

// Breakpoints
$breakpoints: (
  xs: 0,
  sm: 640px,
  md: 768px,
  lg: 1024px,
  xl: 1280px,
  2xl: 1536px,
);
```

## 2. Couleurs

### 2.1 Palette de Base

```typescript
// theme/colors.ts
export const colors = {
  // Couleurs primaires (inspirées d'Arc)
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7', // Principal
    600: '#9333EA',
    700: '#7C3AED',
    800: '#6B21A8',
    900: '#581C87',
    950: '#3B0764',
  },

  // Couleurs secondaires
  pink: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899',
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
  },

  // Neutres
  gray: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // Sémantiques
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Couleurs de messages
  message: {
    sent: '#E9D5FF', // Purple clair
    received: '#F3F4F6', // Gray clair
    sending: '#FEF3C7', // Jaune clair (en cours d'envoi)
  },
};

// Mode sombre
export const darkColors = {
  background: {
    primary: '#09090B',
    secondary: '#18181B',
    tertiary: '#27272A',
  },
  text: {
    primary: '#FAFAFA',
    secondary: '#A1A1AA',
    tertiary: '#71717A',
  },
  border: {
    default: '#3F3F46',
    focus: '#A855F7',
  },
};
```

### 2.2 Application des Couleurs

```css
/* tailwind.config.js - Extension des couleurs */
module.exports = {
  theme: {
    extend: {
      colors: {
        purple: colors.purple,
        pink: colors.pink,
        gray: colors.gray,

        // Alias sémantiques
        primary: colors.purple[500],
        'primary-dark': colors.purple[700],
        'primary-light': colors.purple[300],

        background: {
          DEFAULT: '#FFFFFF',
          secondary: colors.pink[50],
          tertiary: colors.gray[50],
        },

        text: {
          DEFAULT: colors.gray[900],
          secondary: colors.gray[600],
          tertiary: colors.gray[400],
        },
      },
    },
  },
};
```

## 3. Typographie

### 3.1 Système Typographique

```scss
// _typography.scss
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

// Font families
$font-sans:
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  Roboto,
  sans-serif;
$font-mono: 'SF Mono', Monaco, Consolas, 'Liberation Mono', monospace;

// Font sizes
$font-sizes: (
  xs: 0.75rem,
  // 12px
  sm: 0.875rem,
  // 14px
  base: 1rem,
  // 16px
  lg: 1.125rem,
  // 18px
  xl: 1.25rem,
  // 20px
  2xl: 1.5rem,
  // 24px
  3xl: 1.875rem,
  // 30px
  4xl: 2.25rem,
  // 36px
);

// Line heights
$line-heights: (
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
);

// Font weights
$font-weights: (
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
);

// Styles de texte prédéfinis
@mixin heading-1 {
  font-size: map-get($font-sizes, 3xl);
  font-weight: map-get($font-weights, bold);
  line-height: map-get($line-heights, tight);
  letter-spacing: -0.02em;
}

@mixin heading-2 {
  font-size: map-get($font-sizes, 2xl);
  font-weight: map-get($font-weights, semibold);
  line-height: map-get($line-heights, tight);
  letter-spacing: -0.01em;
}

@mixin body-text {
  font-size: map-get($font-sizes, base);
  font-weight: map-get($font-weights, normal);
  line-height: map-get($line-heights, relaxed);
}

@mixin caption {
  font-size: map-get($font-sizes, xs);
  font-weight: map-get($font-weights, normal);
  line-height: map-get($line-heights, normal);
  color: var(--text-secondary);
}
```

### 3.2 Composants Typography

```typescript
// components/ui/Typography.tsx
import { cn } from '@/lib/utils';

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  h1: 'text-3xl font-bold leading-tight tracking-tight',
  h2: 'text-2xl font-semibold leading-tight tracking-tight',
  h3: 'text-xl font-medium leading-snug',
  body: 'text-base font-normal leading-relaxed',
  caption: 'text-xs font-normal leading-normal text-gray-600',
  label: 'text-sm font-medium leading-none',
};

export function Typography({ variant = 'body', children, className }: TypographyProps) {
  const Component = variant.startsWith('h') ? variant : 'p';

  return (
    <Component className={cn(variantStyles[variant], className)}>
      {children}
    </Component>
  );
}
```

## 4. Composants UI

### 4.1 Boutons

```typescript
// components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-500',
        secondary: 'bg-purple-100 text-purple-700 hover:bg-purple-200 focus:ring-purple-400',
        ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-400',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
```

### 4.2 Input et Formulaires

```typescript
// components/ui/Input.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            className={cn(
              'block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
              'placeholder:text-gray-400',
              'disabled:bg-gray-50 disabled:text-gray-500',
              icon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
```

### 4.3 Message Bubbles

```typescript
// components/chat/MessageBubble.tsx
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    timestamp: Date;
    senderId: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    attachments?: Array<{
      type: 'image' | 'file' | 'video';
      url: string;
      name: string;
    }>;
  };
  isOwn: boolean;
  showAvatar?: boolean;
  onReply?: () => void;
}

export function MessageBubble({ message, isOwn, showAvatar, onReply }: MessageBubbleProps) {
  const { content, timestamp, status, attachments } = message;

  const renderStatus = () => {
    if (!isOwn) return null;

    switch (status) {
      case 'sending':
        return <div className="w-4 h-4 rounded-full border-2 border-gray-400 animate-spin" />;
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-2 mb-2',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      {!isOwn && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
      )}

      <div className={cn('max-w-[70%] group')}>
        <div
          className={cn(
            'px-4 py-2 rounded-2xl relative',
            isOwn
              ? 'bg-purple-500 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          )}
        >
          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="mb-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="mb-1">
                  {attachment.type === 'image' && (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="rounded-lg max-w-full"
                    />
                  )}
                  {attachment.type === 'file' && (
                    <div className={cn(
                      'flex items-center gap-2 p-2 rounded',
                      isOwn ? 'bg-purple-600' : 'bg-gray-200'
                    )}>
                      <FileIcon className="w-4 h-4" />
                      <span className="text-sm truncate">{attachment.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message content */}
          <p className="whitespace-pre-wrap break-words">{content}</p>

          {/* Timestamp and status */}
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            <span className={cn(
              'text-xs',
              isOwn ? 'text-purple-200' : 'text-gray-500'
            )}>
              {format(timestamp, 'HH:mm', { locale: fr })}
            </span>
            {renderStatus()}
          </div>
        </div>

        {/* Actions on hover */}
        <div className={cn(
          'opacity-0 group-hover:opacity-100 transition-opacity mt-1',
          'flex gap-1',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          <button
            onClick={onReply}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
          >
            <Reply className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-200 rounded text-gray-600">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

### 4.4 Avatar Component

```typescript
// components/ui/Avatar.tsx
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const sizeStyles = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
};

export function Avatar({ src, alt, size = 'md', status, className }: AvatarProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      <div className={cn(
        'rounded-full overflow-hidden bg-gray-200 flex items-center justify-center',
        sizeStyles[size]
      )}>
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <User className={cn('text-gray-500', size === 'xs' ? 'w-4 h-4' : 'w-6 h-6')} />
        )}
      </div>

      {status && (
        <div className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-white',
          statusColors[status],
          size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
        )} />
      )}
    </div>
  );
}
```

## 5. Animations et Transitions

### 5.1 Configuration Framer Motion

```typescript
// lib/animations.ts
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

export const sidebarTransition = {
  open: {
    width: 320,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  closed: {
    width: 0,
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

export const messageTransition = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
  },
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};
```

### 5.2 Composants Animés

```typescript
// components/ui/AnimatedList.tsx
import { motion } from 'framer-motion';
import { staggerChildren } from '@/lib/animations';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={staggerChildren}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// components/ui/AnimatedPresence.tsx
import { AnimatePresence as FramerAnimatePresence } from 'framer-motion';

export function AnimatedPresence({ children }: { children: React.ReactNode }) {
  return (
    <FramerAnimatePresence mode="wait">
      {children}
    </FramerAnimatePresence>
  );
}
```

## 6. Icônes et Assets

### 6.1 Système d'Icônes

```typescript
// components/ui/Icon.tsx
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export function Icon({ icon: IconComponent, size = 'md', color, className }: IconProps) {
  return (
    <IconComponent
      size={sizeMap[size]}
      color={color}
      className={cn('transition-colors', className)}
    />
  );
}
```

### 6.2 Icônes Personnalisées

```typescript
// components/icons/CustomIcons.tsx
export const CategoryIcons = {
  inbox: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M3 8L12 13L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  personal: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  work: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 7V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};
```

## 7. Responsive Design

### 7.1 Breakpoint System

```scss
// _responsive.scss
@mixin for-phone-only {
  @media (max-width: 639px) {
    @content;
  }
}

@mixin for-tablet-portrait-up {
  @media (min-width: 640px) {
    @content;
  }
}

@mixin for-tablet-landscape-up {
  @media (min-width: 768px) {
    @content;
  }
}

@mixin for-desktop-up {
  @media (min-width: 1024px) {
    @content;
  }
}

@mixin for-big-desktop-up {
  @media (min-width: 1280px) {
    @content;
  }
}

// Utilisation
.sidebar {
  width: 100%;

  @include for-tablet-landscape-up {
    width: 320px;
  }

  @include for-phone-only {
    position: fixed;
    z-index: 50;
  }
}
```

### 7.2 Composant Responsive Container

```typescript
// components/ui/Container.tsx
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  full: 'max-w-full',
};

export function Container({ children, size = 'xl', className }: ContainerProps) {
  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
}
```

## 8. Thèmes et Personnalisation

### 8.1 Theme Provider

```typescript
// contexts/ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    const appliedTheme = theme === 'system' ? systemTheme : theme;
    setResolvedTheme(appliedTheme);

    root.classList.remove('light', 'dark');
    root.classList.add(appliedTheme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

### 8.2 Variables CSS pour Thèmes

```css
/* globals.css */
:root {
  /* Light theme */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;

  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;

  --primary: 265 83% 66%;
  --primary-foreground: 0 0% 100%;

  --secondary: 293 69% 49%;
  --secondary-foreground: 0 0% 100%;

  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;

  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;

  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 265 83% 66%;

  --radius: 0.5rem;
}

.dark {
  /* Dark theme */
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;

  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;

  --primary: 265 83% 66%;
  --primary-foreground: 240 10% 3.9%;

  --secondary: 293 69% 49%;
  --secondary-foreground: 0 0% 98%;

  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;

  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;

  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 265 83% 66%;
}
```

## 9. Accessibilité

### 9.1 Focus Management

```typescript
// hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const root = rootRef.current;
    if (!root) return;

    const focusableElements = root.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    root.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();

    return () => {
      root.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return rootRef;
}
```

### 9.2 Annonces ARIA

```typescript
// components/ui/LiveRegion.tsx
import { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  type?: 'polite' | 'assertive';
}

export function LiveRegion({ message, type = 'polite' }: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (regionRef.current && message) {
      regionRef.current.textContent = message;
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={type}
      aria-atomic="true"
      className="sr-only"
    />
  );
}
```

## 10. Guidelines d'Utilisation

### 10.1 Bonnes Pratiques

1. **Cohérence** : Utiliser les composants et styles définis dans le design system
2. **Performance** : Privilégier les animations CSS quand possible
3. **Accessibilité** : Toujours tester avec un lecteur d'écran
4. **Responsive** : Tester sur mobile, tablette et desktop
5. **Thèmes** : S'assurer que les composants fonctionnent en mode clair et sombre

### 10.2 Checklist de Validation

- [ ] Le contraste des couleurs respecte WCAG AA (4.5:1 pour le texte normal)
- [ ] Tous les éléments interactifs ont un état de focus visible
- [ ] Les animations respectent `prefers-reduced-motion`
- [ ] Les images ont des attributs `alt` appropriés
- [ ] La navigation au clavier est logique et complète
- [ ] Les formulaires ont des labels associés
- [ ] Les erreurs sont annoncées aux lecteurs d'écran
- [ ] Le contenu est lisible jusqu'à 200% de zoom

Ce design system fournit une base solide pour créer une expérience utilisateur cohérente et accessible dans votre application de messagerie.
