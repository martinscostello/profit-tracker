import axios from 'axios';

const getBaseUrl = () => {
    // 1. Manual Override (For mobile testing)
    const customUrl = localStorage.getItem('custom_api_url');
    if (customUrl) return customUrl;

    // 2. Environment Variable
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl;

    const hostname = window.location.hostname;
    // For local web development or when Capacitor defaults to localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }

    // Fallback for LAN testing
    return `${window.location.protocol}//${hostname}:5000/api`;
};


const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
