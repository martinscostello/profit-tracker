import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Calculator, Receipt, FileText, Search, PieChart } from 'lucide-react';

interface Props {
    onComplete: () => void;
}

export function CalculationOverlay({ onComplete }: Props) {
    const [step, setStep] = useState(0);
    const [scrollingNumber, setScrollingNumber] = useState(0);

    // Initialize random steps on mount
    const [steps] = useState(() => {
        const pool = [
            { text: "Scanning sales records...", icon: Receipt },
            { text: "Analyzing expense categories...", icon: PieChart },
            { text: "Verifying tax exemptions...", icon: Search },
            { text: "Applying VAT calculations...", icon: Calculator },
            { text: "Checking regulatory compliance...", icon: FileText },
            { text: "Optimizing for tax efficiency...", icon: CheckCircle2 },
            { text: "Summarizing financial data...", icon: Receipt },
            { text: "Reviewing business deductions...", icon: Calculator }
        ];

        // Shuffle and pick 3-4 random steps
        const count = Math.floor(Math.random() * 2) + 3; // 3 or 4 steps
        const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

        // Add Final Step (Always last)
        const finalSteps = [
            ...shuffled,
            { text: "Generating your Tax Insight...", icon: Loader2 }
        ];

        // Random Total Duration: 5000ms - 8000ms
        const totalDuration = Math.floor(Math.random() * 3000) + 5000;

        // Distribute duration
        // We give the last step a bit less time (fixed 1000ms?), distribute rest?
        // Let's just distribute evenly with jitter.
        const avgDuration = totalDuration / finalSteps.length;

        return finalSteps.map(s => ({
            ...s,
            // +/- 200ms jitter, ensuring min 800ms
            duration: Math.max(800, avgDuration + (Math.random() * 400 - 200))
        }));
    });

    // fake number scrolling effect
    useEffect(() => {
        const interval = setInterval(() => {
            setScrollingNumber(Math.floor(Math.random() * 1000000) + 50000);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // Step sequencer
    useEffect(() => {
        let currentStep = 0;
        let timeoutId: any;

        const runStep = () => {
            if (currentStep >= steps.length) {
                onComplete();
                return;
            }

            // Move to next step after duration
            const duration = steps[currentStep].duration;
            timeoutId = setTimeout(() => {
                currentStep++;
                if (currentStep < steps.length) {
                    setStep(currentStep);
                    runStep();
                } else {
                    onComplete();
                }
            }, duration);
        };

        // Only run if steps have been initialized
        if (steps.length > 0) {
            runStep();
        }

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [steps]); // steps is stable from useState init

    const CurrentIcon = steps[step]?.icon || Loader2;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'var(--color-bg)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'sans-serif'
        }}>
            {/* Background "Matrix" of numbers (Faint) */}
            <div style={{
                position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.05,
                pointerEvents: 'none', display: 'flex', flexWrap: 'wrap', gap: '2rem',
                justifyContent: 'center', alignContent: 'center'
            }}>
                {Array.from({ length: 50 }).map((_, i) => (
                    <div key={i} style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {Math.floor(Math.random() * 99999)}
                    </div>
                ))}
            </div>

            {/* Central Content */}
            <div className="animate-in zoom-in-95 duration-500" style={{
                textAlign: 'center', position: 'relative', zIndex: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem'
            }}>

                {/* Rolling Number Display */}
                <div style={{
                    fontSize: '2.5rem', fontWeight: '900', color: '#2563eb',
                    fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px'
                }}>
                    ₦{scrollingNumber.toLocaleString()}
                </div>

                {/* Progress Visual */}
                <div style={{
                    width: '60px', height: '60px',
                    backgroundColor: '#eff6ff', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#2563eb', marginBottom: '0.5rem',
                    boxShadow: '0 0 0 8px #f0f9ff'
                }}>
                    <CurrentIcon size={32} className={step < 3 ? "animate-spin" : ""} />
                </div>

                {/* Status Text */}
                <div style={{ minHeight: '80px' }}>
                    <h3 className="animate-in fade-in slide-in-from-bottom-2" key={step} style={{
                        fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem'
                    }}>
                        {steps[step]?.text}
                    </h3>
                    <div style={{
                        width: '200px', height: '4px', backgroundColor: '#e2e8f0',
                        borderRadius: '2px', margin: '0 auto', overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%', backgroundColor: '#2563eb',
                            width: `${((step + 0.5) / steps.length) * 100}%`,
                            transition: 'width 0.5s ease-out'
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
