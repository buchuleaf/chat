// Configuration for the frontend application
window.AppConfig = {
    // API Configuration
    api: {
        // Base URL for the backend API
        // Updated to use myzrok.io hosting
        baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000'  // Development
            : 'https://5i0nwutuloay.share.zrok.io',  // Replace with your myzrok.io URL
        
        // API endpoints
        endpoints: {
            health: '/api/health',
            chat: '/api/chat'
        },
        
        // Request timeout in milliseconds
        timeout: 30000,
        
        // Default headers for API requests
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'skip_zrok_interstitial': 'true',
            'zrok-skip-browser-warning': '1',
            'myzrok-skip-browser-warning': '1'
        }
    },
    
    // Default model parameters
    defaults: {
        maxTokens: 2048,
        temperature: 0.7
    },
    
    // UI Configuration
    ui: {
        scrollThreshold: 100,
        errorDisplayTime: 5000,
        healthCheckInterval: 30000
    }
};

// Environment detection
window.AppConfig.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';