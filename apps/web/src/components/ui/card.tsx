import { HTMLAttributes, forwardRef, ReactNode } from 'react';

type Variant = 'default' | 'gradient' | 'glow' | 'flat';
type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: Padding;
  hover?: boolean;
  children?: ReactNode;
}

const padMap: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

const variantMap: Record<Variant, string> = {
  default: 'glass rounded-2xl',
  gradient: 'rounded-2xl bg-gradient-brand text-white shadow-md',
  glow: 'glass rounded-2xl ring-glow',
  flat: 'rounded-2xl',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', padding = 'md', hover = false, className = '', children, style, ...rest },
  ref
) {
  const base = variantMap[variant];
  const hoverCls = hover ? 'hover-lift cursor-pointer' : '';
  return (
    <div
      ref={ref}
      className={`${base} ${padMap[padding]} ${hoverCls} ${className}`}
      style={{
        ...(variant === 'flat' ? { background: 'var(--bg-card)', border: '1px solid var(--border)' } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
});

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-3 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`text-base font-semibold ${className}`} style={{ color: 'var(--text)' }}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm ${className}`} style={{ color: 'var(--text-muted)' }}>{children}</p>;
}
