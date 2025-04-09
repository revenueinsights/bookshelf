import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  ...rest
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-400',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:text-gray-400 dark:border-white/10 dark:text-white dark:hover:bg-white/10',
    text: 'text-brand-500 hover:bg-brand-50 disabled:text-brand-300 dark:hover:bg-white/5',
  };
  
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  
  return (
    <button
      className={buttonClasses}
      type={type}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;