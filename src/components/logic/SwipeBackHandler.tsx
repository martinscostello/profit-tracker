import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function SwipeBackHandler() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let touchStartX = 0;
        let touchStartY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = Math.abs(touchEndY - touchStartY);

            // Logic:
            // 1. Must start from the left edge (Simulating native edge swipe) - e.g., first 50px
            // 2. Must be a significant horizontal swipe (> 100px)
            // 3. Must be mostly horizontal (deltaY < deltaX) to avoid scrolling confusion
            if (touchStartX < 50 && deltaX > 100 && deltaY < deltaX) {
                // If not on home page/dashboard, go back
                if (location.pathname !== '/') {
                    navigate(-1);
                }
            }
        };

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [navigate, location]);

    return null; // This component renders nothing, just attaches listeners
}
