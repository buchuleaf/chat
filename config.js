// Configuration for the frontend application
window.AppConfig = {
    // API Configuration
    api: {
        // Base URL for the backend API
        // Update this with your ngrok URL when deployed
        baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000'  // Development
            : 'https://99391ded4dae.ngrok-free.app',  // Replace with your ngrok URL
        
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
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json'
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