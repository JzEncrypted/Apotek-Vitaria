import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { FAIcon, IconKey } from './FAIcon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconKey;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-150 btn-press select-none focus:outline-none focus:ring-2 focus:ring-[#84A282]/40 disabled:opacity-50 disabled:pointer-events-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-9 rounded-xl',
    md: 'text-xs sm:text-sm px-4 py-2.5 gap-2 h-11',
    lg: 'text-sm sm:text-base px-5 py-3 gap-2.5 h-12 sm:h-13'
  };

  const variantStyles = {
    primary: 'bg-[#84A282] hover:bg-[#587A58] text-white shadow-soft active:shadow-none',
    secondary: 'bg-[#E6EEE3] hover:bg-[#84A282]/20 text-[#587A58]',
    soft: 'bg-[#F0F5ED] hover:bg-[#E6EEE3] text-[#26382B]',
    outline: 'border border-[#E7EBE4] hover:bg-[#F0F5ED] text-[#26382B]',
    danger: 'bg-[#D96A68] hover:bg-[#c25553] text-white shadow-soft',
    ghost: 'hover:bg-[#F0F5ED] text-[#778477] hover:text-[#26382B]'
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <FAIcon name="refresh" className="animate-spin text-sm" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <FAIcon name={icon} />}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <FAIcon name={icon} />}
        </>
      )}
    </button>
  );
};

export default Button;
