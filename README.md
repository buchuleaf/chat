# Gemma 3n Frontend

Static frontend for Gemma 3n AI Chat - deployed via GitHub Pages.

## Setup

1. Update your ngrok URL in `config.js`
2. Deploy this folder to GitHub Pages
3. Make sure your backend is running with ngrok tunnel

## Files

- `index.html` - Main chat interface  
- `app.js` - Chat functionality
- `config.js` - Configuration (update ngrok URL here)
- `styles.css` - UI styling

## Local Development

```bash
# Serve the frontend locally
python -m http.server 8080
# Access at http://localhost:8080
```

## GitHub Pages Deployment

1. Push this folder to your GitHub repository
2. Go to repository Settings > Pages
3. Set source to deploy from main branch / root folder
4. Access via your GitHub Pages URL