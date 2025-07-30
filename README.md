# Gemma 3n Frontend

A secure frontend interface for the Gemma 3n AI chat application, designed to be deployed on GitHub Pages while communicating with a locally hosted backend.

## Features

- 🔒 **Secure Communication**: No backend credentials or sensitive information exposed
- 🚀 **GitHub Pages Ready**: Optimized for static deployment
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Real-time Streaming**: Live response streaming from AI model
- 🎨 **Modern UI**: Clean, professional interface

## Deployment Instructions

### 1. Fork or Create Repository

1. Create a new GitHub repository
2. Upload all files from the `frontend/` directory to the repository root

### 2. Enable GitHub Pages

1. Go to your repository Settings
2. Navigate to "Pages" in the sidebar
3. Under "Source", select "GitHub Actions"
4. The deployment workflow will run automatically on push

### 3. Configure Backend URL

Before deployment, edit `config.js` and update the production backend URL:

```javascript
baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000'  // Development
    : 'https://your-backend-domain.com',  // Production - UPDATE THIS
```

Replace `https://your-backend-domain.com` with your actual backend URL.

## Security Features

### Frontend Security Measures

- **No Backend Exposure**: No backend URLs, API keys, or sensitive data in the frontend code
- **Environment-Based Configuration**: Automatic detection of development vs production
- **Request Timeout Protection**: Prevents hanging requests
- **Error Sanitization**: Generic error messages that don't expose backend details
- **HTTPS Enforcement**: Automatic HTTPS usage in production environments

### Backend Requirements

Your backend must implement the following security measures:

1. **CORS Configuration**: Allow requests from your GitHub Pages domain
```javascript
const cors = require('cors');
app.use(cors({
    origin: ['https://yourusername.github.io', 'http://localhost:8080'],
    credentials: false
}));
```

2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Input Validation**: Validate all incoming requests
4. **No Sensitive Data**: Never return backend configuration or internal details

## API Endpoints Expected

The frontend expects these endpoints from your backend:

- `GET /api/health` - Health check endpoint
- `POST /api/chat` - Chat completion endpoint with streaming support

## Local Development

To test locally:

```bash
# Serve the frontend
python -m http.server 8080

# Or using Node.js
npx http-server -p 8080

# Access at http://localhost:8080
```

## Configuration

The `config.js` file contains all configurable settings:

- API base URL (environment-specific)
- Request timeouts
- Default model parameters
- UI settings
- Security flags

## File Structure

```
frontend/
├── index.html          # Main HTML file
├── app.js              # Main application logic
├── config.js           # Configuration settings
├── styles.css          # Styling
├── package.json        # Project metadata
├── README.md           # This file
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Actions deployment
```

## Browser Support

- Chrome/Chromium 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details