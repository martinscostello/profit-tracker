import { useState, useEffect } from 'react';

// Global log store
const logHistory: string[] = [];
let listeners: ((logs: string[]) => void)[] = [];

export const screenLog = (...args: any[]) => {
    const msg = args.map(a =>
        typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
    ).join(' ');

    // Add timestamp
    const time = new Date().toISOString().split('T')[1].slice(0, 8);
    logHistory.push(`[${time}] ${msg}`);

    // Notify listeners
    listeners.forEach(l => l([...logHistory]));

    // Also log to real console
    console.log(...args);
};

export const useScreenLogs = () => {
    const [logs, setLogs] = useState<string[]>(logHistory);

    useEffect(() => {
        const handler = (newLogs: string[]) => setLogs(newLogs);
        listeners.push(handler);
        return () => {
            listeners = listeners.filter(l => l !== handler);
        };
    }, []);

    return logs;
};

export const ScreenLogOverlay = () => {
    const logs = useScreenLogs();

    if (logs.length === 0) return null;

    return (
        <div style= {{
        position: 'fixed',
            bottom: 0,
                left: 0,
                    right: 0,
                        height: '200px',
                            backgroundColor: 'rgba(0,0,0,0.8)',
                                color: '#00ff00',
                                    fontFamily: 'monospace',
                                        fontSize: '12px',
                                            overflowY: 'auto',
                                                zIndex: 9999,
                                                    padding: '10px',
                                                        pointerEvents: 'none' // Allow clicking through
    }
}>
    <h4 style={ { margin: 0, borderBottom: '1px solid #333', color: '#fff' } }> System Logs </h4>
{
    logs.map((log, i) => (
        <div key= { i } > { log } </div>
    ))
}
</div>
    );
};
