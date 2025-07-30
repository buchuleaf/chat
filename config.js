// Minimal configuration for the frontend application
window.AppConfig = {
    // API Configuration - single endpoint only
    api: {
        // Base URL for the backend API
        baseUrl: 'https://3cf9ps4x0101.share.zrok.io',  // Production via zrok tunnel
        
        // Single endpoint for all communication
        endpoint: '/api/message'
    },
    
    // UI Configuration
    ui: {
        scrollThreshold: 100,
        errorDisplayTime: 5000,
        connectionCheckInterval: 30000
    }
};