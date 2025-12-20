import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    helperText?: string;
    containerStyle?: React.CSSProperties;
}

export function Input({ label, helperText, className = '', containerStyle: userContainerStyle, ...props }: InputProps) {
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.5rem',
        marginBottom: '1rem',
        ...userContainerStyle
    };

    const labelStyle = {
        fontSize: '0.875rem',
        fontWeight: '500',
        color: 'var(--color-text)',
    };

    const inputStyle = {
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        width: '100%',
    };

    return (
        <div style={containerStyle}>
            {label && <label style={labelStyle}>{label}</label>}
            <input
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                className={className}
                {...props}
            />
            {helperText && (
                <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {helperText}
                </p>
            )}
        </div>
    );
}
