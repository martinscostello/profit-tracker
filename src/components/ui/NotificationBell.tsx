import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

interface NotificationBellProps {
    color?: string;
    size?: number;
}

export function NotificationBell({ color = 'var(--color-text)', size = 24 }: NotificationBellProps) {
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();

    return (
        <button
            onClick={() => navigate('/notifications')}
            style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                marginRight: '-0.5rem', // Offset padding slightly
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Bell size={size} color={color} />
            {unreadCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    border: '2px solid var(--color-bg)'
                }} />
            )}
        </button>
    );
}
