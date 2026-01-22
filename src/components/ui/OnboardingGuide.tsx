
import { useEffect, useState } from 'react';
import Joyride, { STATUS, type CallBackProps, type Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import { StorageService } from '../../services/StorageService';

export function OnboardingGuide() {
    const location = useLocation();
    const [run, setRun] = useState(false);
    const [steps, setSteps] = useState<Step[]>([]);

    useEffect(() => {
        // Define steps based on current route
        let currentSteps: Step[] = [];
        const isCompleted = StorageService.load(`guide_completed_${location.pathname}`, false);

        if (isCompleted) {
            setRun(false);
            return;
        }

        switch (location.pathname) {
            case '/':
                currentSteps = [
                    {
                        target: 'body',
                        content: 'Welcome to Profit Tracker! This dashboard gives you a quick overview of your business performance.',
                        placement: 'center',
                        disableBeacon: true,
                    },
                    {
                        target: '.notification-bell', // Need to add class
                        content: 'Check here for important notifications about low stock or business updates.',
                    },
                    {
                        target: '.fab-add-sale', // Assuming we can target the add button
                        content: 'Tap here to record a new sale quickly.',
                    }
                ];
                break;
            case '/products':
                currentSteps = [
                    {
                        target: '#import-btn',
                        content: 'Have an existing inventory? Import it directly from Excel/CSV here!',
                        disableBeacon: true,
                    },
                    {
                        target: '#add-product-btn',
                        content: 'Or add products manually one by one here.',
                    }
                ];
                break;
            // Add more pages as needed
        }

        if (currentSteps.length > 0) {
            setSteps(currentSteps);
            // Small delay to ensure elements are rendered
            setTimeout(() => setRun(true), 500);
        }
    }, [location.pathname]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            // Mark this page's guide as completed
            StorageService.save(`guide_completed_${location.pathname}`, true);
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showSkipButton
            showProgress
            styles={{
                options: {
                    primaryColor: '#16a34a', // Green-600
                    zIndex: 1000,
                    backgroundColor: 'var(--color-surface)',
                    textColor: 'var(--color-text)',
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                    arrowColor: 'var(--color-surface)',
                },
                tooltip: {
                    borderRadius: '1rem',
                    padding: '1.5rem',
                },
                tooltipContainer: {
                    lineHeight: 1.5,
                    textAlign: 'left',
                },
                buttonNext: {
                    backgroundColor: '#16a34a',
                },
                buttonBack: {
                    color: '#16a34a',
                }
            }}
            callback={handleJoyrideCallback}
        />
    );
}
