import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'outline' | 'glass' | 'gradient';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}

const sizeMap: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-2xl gap-2',
  icon: 'p-2.5 rounded-xl',
};

const variantMap: Record<Variant, string> = {
  primary: 'text-white shadow-sm hover:opacity-90',
  gradient: 'text-white shadow-md hover:opacity-95 bg-gradient-animated',
  glass: 'glass hover:opacity-90',
  outline: 'border hover:opacity-80',
  ghost: 'hover:opacity-80',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', children, style, disabled, ...rest },
  ref
) {
  const base = sizeMap[size] + ' ' + variantMap[variant];
  const computedStyle: React.CSSProperties = { ...style };
  if (variant === 'primary' || variant === 'gradient') {
    if (!computedStyle.background && variant === 'primary') computedStyle.background = 'var(--accent)';
    if (variant === 'gradient' && !computedStyle.backgroundImage) computedStyle.backgroundImage = 'var(--gradient-brand)';
  }
  if (variant === 'glass') {
    computedStyle.color = computedStyle.color || 'var(--text)';
  }
  if (variant === 'outline') {
    computedStyle.borderColor = 'var(--border)';
    computedStyle.color = computedStyle.color || 'var(--text)';
  }
  if (variant === 'ghost') {
    computedStyle.color = computedStyle.color || 'var(--text)';
  }
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${base} ${className}`}
      style={computedStyle}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
});
