
import React from 'react';
import { RefreshCw } from 'lucide-react';

interface CloudSyncButtonProps {
    onClick: () => void;
    isSyncing: boolean;
    className?: string;
}

export const CloudSyncButton: React.FC<CloudSyncButtonProps> = ({ onClick, isSyncing, className }) => {
    return (
        <button
            onClick={onClick}
            className={className}
            style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                position: 'relative',
                width: '48px',
                height: '42px', // Adjusted to fit cloud aspect
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            title="Sync with Cloud"
        >
            <svg width="0" height="0">
                <defs>
                    <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#bf0aff" />
                        <stop offset="100%" stopColor="#7805e3" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Static Cloud Layer */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                {/* Using a custom SVG path or large Lucide Cloud if possible, but Lucide Cloud is an outline usually. 
                     We need a FILLED cloud to match the user's solid look. 
                     I will use a standard Cloud SVG path filled with the gradient. */}
                <svg
                    viewBox="0 0 24 24"
                    fill="url(#cloudGradient)"
                    stroke="none"
                    style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}
                >
                    <path d="M17.5,19c-0.83,0-1.5-0.67-1.5-1.5c0-0.83,0.67-1.5,1.5-1.5c0.83,0,1.5,0.67,1.5,1.5C19,18.33,18.33,19,17.5,19z" style={{ display: 'none' }} />
                    <path d="M17.5,19 C19.9852814,19 22,16.9852814 22,14.5 C22,12.132 20.177,10.244 17.86,10.055 C17.485,6.39 14.39,3.5 10.5,3.5 C6.985,3.5 4.05,6.01 3.255,9.255 C0.965,10.03 0.5,12.5 1.96,14.315 C2.645,15.165 3.565,15.79 4.62,15.935 C4.085,16.485 3.75,17.235 3.75,18.05 C3.75,19.68 5.07,21 6.7,21 L16,21 L16,21 M17.5,19 L7,19" />
                    {/* The standard cloud shape simplified */}
                    <path d="M4.0 12.0 A 4 4 0 0 0 4.0 20.0 L 18.0 20.0 A 4 4 0 0 0 18.0 12.0 A 4 4 0 0 0 14.0 8.0 A 6 6 0 0 0 4.0 12.0 Z" />
                </svg>
            </div>

            {/* Spinner Layer (Centered/Overlaid) */}
            <div style={{
                position: 'absolute',
                zIndex: 2,
                backgroundColor: 'url(#cloudGradient)', // Actually we want the spinner to have the gradient background or just white arrow on gradient circle?
                // The user image shows: Solid Purple Cloud. On top (bottom center) is a Purple Circle with White Arrows.
                bottom: '-2px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--color-surface)', // White background so we can see the spinner if it's purple, OR purple background with white spinner. 
                // Let's assume Purple Circle with White Arrows to allow the arrows to spin.
                backgroundImage: 'linear-gradient(135deg, #bf0aff 0%, #7805e3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                border: '2px solid white' // To separate from the cloud slightly
            }}>
                <RefreshCw
                    size={16}
                    color="white"
                    className={isSyncing ? "spin-slick" : ""}
                    strokeWidth={3}
                />
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin-slick { animation: spin 1s linear infinite; }
            `}</style>
        </button>
    );
};
