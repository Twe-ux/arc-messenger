'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white font-medium select-none',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        default: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
        '2xl': 'h-20 w-20 text-2xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const statusVariants = cva(
  'absolute rounded-full border-2 border-white',
  {
    variants: {
      status: {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
        away: 'bg-yellow-500',
        busy: 'bg-red-500',
      },
      size: {
        xs: 'h-2 w-2 bottom-0 right-0',
        sm: 'h-2.5 w-2.5 bottom-0 right-0',
        default: 'h-3 w-3 bottom-0.5 right-0.5',
        lg: 'h-3.5 w-3.5 bottom-0.5 right-0.5',
        xl: 'h-4 w-4 bottom-1 right-1',
        '2xl': 'h-5 w-5 bottom-1 right-1',
      },
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  name?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  fallbackIcon?: React.ReactNode;
  loading?: boolean;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({
    className,
    size,
    src,
    alt,
    name,
    status,
    showStatus = false,
    fallbackIcon,
    loading = false,
    ...props
  }, ref) => {
    // Generate initials from name
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const displayName = name || alt || 'User';
    const initials = getInitials(displayName);

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {loading ? (
          // Loading state
          <div className="animate-pulse bg-gray-300 rounded-full w-full h-full" />
        ) : src ? (
          // Image avatar
          <img
            src={src}
            alt={alt || name}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Hide image on error to show fallback
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : fallbackIcon ? (
          // Custom fallback icon
          <span className="flex items-center justify-center">
            {fallbackIcon}
          </span>
        ) : name ? (
          // Initials fallback
          <span className="font-semibold">
            {initials}
          </span>
        ) : (
          // Default user icon
          <User className={cn(
            'text-white',
            size === 'xs' && 'h-3 w-3',
            size === 'sm' && 'h-4 w-4',
            size === 'default' && 'h-5 w-5',
            size === 'lg' && 'h-6 w-6',
            size === 'xl' && 'h-8 w-8',
            size === '2xl' && 'h-10 w-10'
          )} />
        )}

        {/* Status indicator */}
        {showStatus && status && (
          <div
            className={cn(statusVariants({ status, size }))}
            title={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group for displaying multiple avatars
export interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    name?: string;
    alt?: string;
  }>;
  max?: number;
  size?: VariantProps<typeof avatarVariants>['size'];
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ 
  avatars, 
  max = 3, 
  size = 'default',
  className 
}) => {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = Math.max(0, avatars.length - max);

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          alt={avatar.alt}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      
      {remainingCount > 0 && (
        <Avatar
          size={size}
          className="ring-2 ring-white bg-gray-500"
          name={`+${remainingCount}`}
        />
      )}
    </div>
  );
};

export { Avatar, avatarVariants };