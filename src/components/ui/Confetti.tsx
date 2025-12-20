import { useEffect, useState } from 'react';

export function Confetti() {
    const [pieces, setPieces] = useState<number[]>([]);

    useEffect(() => {
        setPieces(Array.from({ length: 50 }).map((_, i) => i));
    }, []);

    return (
        <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden'
        }}>
            {pieces.map((i) => (
                <div key={i} style={{
                    position: 'absolute',
                    left: `${Math.random() * 100}%`,
                    top: -20,
                    width: '10px',
                    height: '10px',
                    backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 6)],
                    animation: `confetti-fall ${2 + Math.random() * 3}s linear forwards`,
                    animationDelay: `${Math.random() * 2}s`,
                    transform: `rotate(${Math.random() * 360}deg)`
                }} />
            ))}
            <style>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
