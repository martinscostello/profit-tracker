import type { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export function Card({ children, className = '', padding = '1.5rem', style, onClick }: CardProps) {
    const defaultStyle = {
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--color-border)',
        padding: padding,
        ...style
    };

    return (
        <div style={defaultStyle} className={className} onClick={onClick}>
            {children}
        </div>
    );
}
