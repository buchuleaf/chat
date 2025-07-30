// Configuration for the frontend application
// This file handles environment-specific settings
window.AppConfig = {
    // API Configuration
    api: {
        // Base URL for the backend API
        // In production, this should point to your deployed backend
        // For local development, use your local server URL
        baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000'  // Development
            : 'https://your-backend-domain.com',  // Production - replace with your actual backend URL
        
        // API endpoints
        endpoints: {
            health: '/api/health',
            chat: '/api/chat'
        },
        
        // Request timeout in milliseconds
        timeout: 30000,
        
        // Default headers for API requests
        headers: {
            'Content-Type': 'application/json'
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
    },
    
    // Security settings
    security: {
        // Enable/disable certain features based on environment
        allowConfigChange: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        
        // CORS settings are handled by the backend
        enforceHttps: window.location.protocol === 'https:'
    }
};

// Environment detection
window.AppConfig.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
window.AppConfig.isProduction = !window.AppConfig.isDevelopment;