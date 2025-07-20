'use client';

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl',
      h2: 'scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
      h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
      h5: 'scroll-m-20 text-lg font-semibold tracking-tight',
      h6: 'scroll-m-20 text-base font-semibold tracking-tight',
      p: 'leading-7 [&:not(:first-child)]:mt-6',
      lead: 'text-xl text-gray-600 leading-7',
      large: 'text-lg font-semibold',
      small: 'text-sm font-medium leading-none',
      muted: 'text-sm text-gray-500',
      caption: 'text-xs text-gray-500',
      code: 'relative rounded bg-gray-100 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
      kbd: 'pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600',
    },
    color: {
      default: 'text-gray-900',
      primary: 'text-purple-600',
      secondary: 'text-gray-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      muted: 'text-gray-500',
      white: 'text-white',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    variant: 'p',
    color: 'default',
    align: 'left',
  },
});

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'code' | 'kbd';
  children: React.ReactNode;
  truncate?: boolean;
}

const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ 
    className, 
    variant, 
    color, 
    align, 
    weight,
    as, 
    children, 
    truncate = false,
    ...props 
  }, ref) => {
    const elementType = as || getDefaultElement(variant || undefined);
    const classNames = cn(
      typographyVariants({ variant, color, align, weight }),
      truncate && 'truncate',
      className
    );

    // Use createElement to avoid type complexity
    return React.createElement(
      elementType,
      {
        ref,
        className: classNames,
        ...props
      },
      children
    );
  }
);

Typography.displayName = 'Typography';

// Helper function to determine default element based on variant
function getDefaultElement(variant?: string): keyof JSX.IntrinsicElements {
  switch (variant) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return variant as keyof JSX.IntrinsicElements;
    case 'code':
      return 'code';
    case 'kbd':
      return 'kbd';
    case 'lead':
    case 'large':
    case 'small':
    case 'muted':
    case 'caption':
    case 'p':
    default:
      return 'p';
  }
}

// Specific typography components for convenience
export const Heading = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'> & { level: 1 | 2 | 3 | 4 | 5 | 6 }>(
  ({ level, children, ...props }, ref) => (
    <Typography
      ref={ref}
      variant={`h${level}` as any}
      as={`h${level}` as any}
      {...props}
    >
      {children}
    </Typography>
  )
);

Heading.displayName = 'Heading';

export const Text = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  ({ children, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="p"
      as="p"
      {...props}
    >
      {children}
    </Typography>
  )
);

Text.displayName = 'Text';

export const Label = forwardRef<HTMLLabelElement, Omit<TypographyProps, 'variant' | 'as'>>(
  ({ children, className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="small"
      as="span"
      className={cn('font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    >
      {children}
    </Typography>
  )
);

Label.displayName = 'Label';

export const Code = forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  ({ children, className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="code"
      as="code"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  )
);

Code.displayName = 'Code';

export const Kbd = forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  ({ children, className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="kbd"
      as="kbd"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  )
);

Kbd.displayName = 'Kbd';

export { Typography, typographyVariants };