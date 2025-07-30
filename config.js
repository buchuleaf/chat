// Minimal configuration for the frontend application
(function() {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    const baseUrl = isLocal 
        ? 'http://localhost:3000'  // Development
        : 'https://3cf9ps4x0101.share.zrok.io';  // Production via zrok tunnel
    
    // Debug logging
    console.log('Frontend Config Debug:', {
        hostname: hostname,
        isLocal: isLocal,
        baseUrl: baseUrl,
        fullUrl: baseUrl + '/api/message'
    });
    
    window.AppConfig = {
        // API Configuration - single endpoint only
        api: {
            baseUrl: baseUrl,
            endpoint: '/api/message'
        },
    
        // UI Configuration
        ui: {
            scrollThreshold: 100,
            errorDisplayTime: 5000,
            connectionCheckInterval: 30000
        }
    };
})();