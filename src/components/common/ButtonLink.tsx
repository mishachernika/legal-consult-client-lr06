import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { cn } from '@/utils/cn';

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<NonNullable<ButtonLinkProps['variant']>, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary:
    'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizeClasses: Record<NonNullable<ButtonLinkProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

// Посилання, стилізоване як Button. Не вкладаємо <button> у <a> — це невалідний HTML
// і частина браузерів не виконує перехід при натисканні на таку вкладену кнопку.
export default function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        'inline-flex items-center justify-center rounded font-medium transition-colors duration-200',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
