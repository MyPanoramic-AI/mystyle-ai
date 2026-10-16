/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'charcoal' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  // Mobile ergonomic hit target: min-h >= 44px
  const sizeClasses = {
    sm: 'min-h-[40px] px-3.5 py-1.5 text-xs',
    md: 'min-h-[46px] px-5 py-2.5 text-sm',
    lg: 'min-h-[52px] px-7 py-3.5 text-base',
  };

  const variantClasses = {
    primary:
      'bg-[#9C6A61] text-white hover:bg-[#8A5B53] active:bg-[#794E46] shadow-sm hover:shadow transition-all duration-200',
    secondary:
      'bg-white text-[#242326] border border-[#242326]/12 hover:bg-[#F6F2EC] hover:border-[#242326]/25 transition-all duration-200',
    charcoal:
      'bg-[#242326] text-white hover:bg-[#343237] active:bg-[#1A191C] shadow-sm transition-all duration-200',
    ghost:
      'bg-transparent text-[#242326] hover:bg-[#E5CDBE]/20 active:bg-[#E5CDBE]/35 transition-colors duration-150',
    gold:
      'bg-[#B49361] text-white hover:bg-[#A38250] active:bg-[#8F7244] shadow-sm transition-all duration-200',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium tracking-tight rounded-xl
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C6A61] focus-visible:ring-offset-2
        disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
      {icon && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
