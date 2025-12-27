import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const getBaseUrl = () => {
    // 1. Manual Override (For mobile testing)
    const customUrl = localStorage.getItem('custom_api_url');
    if (customUrl) return customUrl;

    // 2. Environment Variable
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl;

    // 3. Platform Specific Defaults
    if (Capacitor.getPlatform() === 'android') {
        // Standard Android Emulator Loopback
        return 'http://10.0.2.2:3001/api';
    }

    if (Capacitor.getPlatform() === 'ios') {
        // Standard iOS Simulator Loopback
        return 'http://localhost:3001/api';
    }

    // 4. Web / Fallback
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001/api';
    }

    // LAN / Production Fallback
    return `${window.location.protocol}//${hostname}:3001/api`;
};


const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config: any) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
