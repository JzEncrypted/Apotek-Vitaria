import React, { InputHTMLAttributes, useState } from 'react';
import { FAIcon, IconKey } from './FAIcon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: IconKey;
  error?: string;
  helperText?: string;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  helperText,
  isPassword = false,
  className = '',
  type = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-semibold text-[#26382B]">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-[#778477] pointer-events-none text-sm">
            <FAIcon name={icon} />
          </div>
        )}

        <input
          type={effectiveType}
          className={`w-full bg-white border rounded-2xl px-3.5 py-3 text-xs sm:text-sm text-[#26382B] placeholder-[#778477]/60 transition-all focus:outline-none focus:ring-2 focus:ring-[#84A282]/30 focus:border-[#84A282] ${
            icon ? 'pl-10' : ''
          } ${isPassword ? 'pr-10' : ''} ${
            error
              ? 'border-[#D96A68] focus:ring-[#D96A68]/30 focus:border-[#D96A68]'
              : 'border-[#E7EBE4]'
          } ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-[#778477] hover:text-[#26382B] text-xs p-1"
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          >
            <FAIcon name={showPassword ? 'eyeSlash' : 'eye'} />
          </button>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-[#D96A68] flex items-center gap-1 mt-1">
          <FAIcon name="circleAlert" className="text-[10px]" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-[#778477] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
