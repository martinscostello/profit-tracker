import { useState, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowRight, Check } from 'lucide-react';

export function Onboarding({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right'>('right');
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);

    const slides = [
        {
            title: "Know Your Profit Daily",
            description: "Stop guessing. Track every sale and know exactly how much you make each day.",
            image: "💰"
        },
        {
            title: "No Accounting Needed",
            description: "Simple and easy to use. No complex spreadsheets or math required.",
            image: "📱"
        },
        {
            title: "Works Offline",
            description: "No internet? No problem. Your data is saved on your phone and works anywhere.",
            image: "⚡"
        }
    ];

    const handleNext = () => {
        if (step < slides.length - 1) {
            setDirection('right');
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setDirection('left');
            setStep(step - 1);
        }
    };

    // Swipe handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            handleNext();
        }
        if (isRightSwipe) {
            handleBack();
        }
    };

    return (
        <div
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '2rem',
                backgroundColor: 'var(--color-bg)',
                textAlign: 'center',
                userSelect: 'none',
                overflow: 'hidden' // Prevent scroll bars during animation
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Key prop triggers re-animation on step change */}
            <div
                key={step}
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    animation: `${direction === 'right' ? 'slideInRight' : 'slideInLeft'} 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`
                }}
            >
                <div style={{
                    fontSize: '6rem',
                    marginBottom: '2rem',
                    // animation: 'bounce 2s infinite', // Removed bounce to avoid conflict/clutter
                    transition: 'transform 0.3s ease-out'
                }}>
                    {slides[step].image}
                </div>

                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    color: 'var(--color-text-primary)'
                }}>
                    {slides[step].title}
                </h1>

                <p style={{
                    fontSize: '1.125rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: '1.6',
                    maxWidth: '300px'
                }}>
                    {slides[step].description}
                </p>
            </div>

            {/* Dots indicator - Static footer */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
                {slides.map((_, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: idx === step ? '2rem' : '0.75rem',
                            height: '0.75rem',
                            borderRadius: '1rem',
                            backgroundColor: idx === step ? 'var(--color-primary)' : 'var(--color-border)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    />
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '1rem' }}>
                <Button
                    onClick={handleNext}
                    style={{
                        width: '85%',
                        padding: '1.25rem',
                        fontSize: '1.25rem',
                        borderRadius: '3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2), 0 2px 4px -1px rgba(22, 163, 74, 0.1)'
                    }}
                >
                    {step === slides.length - 1 ? 'Get Started' : 'Next'}
                    {step === slides.length - 1 ? <Check size={24} /> : <ArrowRight size={24} />}
                </Button>

            </div>
        </div>
    );
}
