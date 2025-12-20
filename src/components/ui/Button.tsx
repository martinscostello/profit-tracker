import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    children: ReactNode;
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
    const baseStyles = {
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: '600',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        border: 'none',
    };

    const variants = {
        primary: {
            backgroundColor: 'var(--color-primary)',
            color: 'white',
        },
        secondary: {
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
        },
        ghost: {
            backgroundColor: 'transparent',
            color: 'var(--color-primary)',
        }
    };

    const style = { ...baseStyles, ...variants[variant] };

    return (
        <button style={style} className={className} {...props}>
            {props.children}
        </button>
    );
}
