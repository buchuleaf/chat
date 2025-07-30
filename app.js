class GemmaChat {
    constructor() {
        this.isConnected = false;
        this.isProcessing = false;
        this.messageHistory = [];
        this.abortController = null;
        this.userHasScrolled = false;
        this.isNearBottom = true;
        this.lastScrollTop = 0;
        
        this.config = window.AppConfig;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeApp();
    }

    initializeElements() {
        this.elements = {
            maxTokens: document.getElementById('maxTokens'),
            temperature: document.getElementById('temperature'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            messages: document.getElementById('messages'),
            loading: document.getElementById('loading'),
            messageInput: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendButton'),
            stopButton: document.getElementById('stopButton'),
            scrollToBottomBtn: document.getElementById('scrollToBottom')
        };
    }

    bindEvents() {
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        this.elements.stopButton.addEventListener('click', () => this.stopGeneration());
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.elements.messageInput.addEventListener('input', () => this.autoResizeTextarea());
        
        // Scroll event handlers
        this.elements.messages.addEventListener('scroll', () => this.handleScroll());
        this.elements.messages.addEventListener('wheel', () => this.markUserScrolled());
        this.elements.messages.addEventListener('touchstart', () => this.markUserScrolled());
        this.elements.messages.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) {
                this.markUserScrolled();
            }
        });
        
        this.elements.scrollToBottomBtn.addEventListener('click', () => {
            this.scrollToBottom(true);
            this.updateScrollButton();
        });
    }

    async initializeApp() {
        // Set default values from config
        this.elements.maxTokens.value = this.config.defaults.maxTokens;
        this.elements.temperature.value = this.config.defaults.temperature;
        
        // Initialize UI
        this.autoResizeTextarea();
        setTimeout(() => this.handleScroll(), 100);
        
        // Check backend connection
        await this.checkBackendConnection();
        
        // Set up periodic health checks
        setInterval(() => {
            this.checkBackendConnection();
        }, this.config.ui.healthCheckInterval);
    }

    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    handleScroll() {
        const container = this.elements.messages;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        this.isNearBottom = distanceFromBottom <= this.config.ui.scrollThreshold;
        
        const scrolledUp = scrollTop < this.lastScrollTop;
        const scrolledDown = scrollTop > this.lastScrollTop;
        
        if (scrolledUp) {
            this.userHasScrolled = true;
        }
        
        if (this.isNearBottom && scrolledDown) {
            this.userHasScrolled = false;
        }
        
        this.lastScrollTop = scrollTop;
        this.updateScrollButton();
    }

    markUserScrolled() {
        this.userHasScrolled = true;
        this.updateScrollButton();
    }

    updateScrollButton() {
        const shouldShow = this.userHasScrolled && !this.isNearBottom;
        this.elements.scrollToBottomBtn.style.display = shouldShow ? 'block' : 'none';
    }

    async checkBackendConnection() {
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.api.timeout);
                
                // Try different approaches to bypass interstitial
                const urls = [
                    `${this.config.api.baseUrl}${this.config.api.endpoints.health}?skip_zrok_interstitial=true`,
                    `${this.config.api.baseUrl}${this.config.api.endpoints.health}`,
                ];
                
                const headers = {
                    ...this.config.api.headers,
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'GemmaChat/1.0'
                };
                
                let response;
                for (const url of urls) {
                    try {
                        response = await fetch(url, {
                            method: 'GET',
                            headers: headers,
                            signal: controller.signal
                        });
                        break;
                    } catch (e) {
                        console.log(`Failed attempt with URL: ${url}`, e.message);
                        continue;
                    }
                }
                
                clearTimeout(timeoutId);
                
                if (!response) {
                    throw new Error('All connection attempts failed');
                }
                
                // Check if we got the interstitial page (usually returns HTML instead of JSON)
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    if (attempt < maxRetries) {
                        console.log(`Attempt ${attempt}: Got interstitial page, retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        continue;
                    } else {
                        this.updateConnectionStatus(false, 'Click here to bypass interstitial page');
                        this.showInterstitialBypassLink();
                        return;
                    }
                }
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'ok') {
                        this.updateConnectionStatus(true, 'Connected');
                        return;
                    } else {
                        this.updateConnectionStatus(false, 'Service unavailable');
                        return;
                    }
                } else if (response.status === 403) {
                    this.updateConnectionStatus(false, 'Access denied - check zrok URL');
                    return;
                } else if (response.status === 502 || response.status === 503) {
                    this.updateConnectionStatus(false, 'Backend service unavailable');
                    return;
                } else {
                    this.updateConnectionStatus(false, `Server error (${response.status})`);
                    return;
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    this.updateConnectionStatus(false, 'Connection timeout');
                    return;
                } else if (error.message.includes('CORS')) {
                    this.updateConnectionStatus(false, 'CORS error - check zrok configuration');
                    return;
                } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                    if (attempt < maxRetries) {
                        console.log(`Attempt ${attempt}: Network error, retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        continue;
                    } else {
                        this.updateConnectionStatus(false, 'Network error - check zrok URL');
                        return;
                    }
                } else {
                    console.error(`Connection attempt ${attempt} failed:`, error);
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        continue;
                    } else {
                        this.updateConnectionStatus(false, 'Connection failed after multiple attempts');
                        return;
                    }
                }
            }
        }
    }

    updateConnectionStatus(connected, message) {
        this.isConnected = connected;
        this.elements.statusDot.classList.toggle('connected', connected);
        this.elements.statusText.textContent = message;
    }

    showInterstitialBypassLink() {
        const bypassUrl = `${this.config.api.baseUrl}?skip_zrok_interstitial=true`;
        const statusElement = this.elements.statusText;
        
        // Make the status text clickable
        statusElement.style.cursor = 'pointer';
        statusElement.style.textDecoration = 'underline';
        statusElement.style.color = '#007bff';
        
        statusElement.onclick = () => {
            // Open bypass URL in new tab
            window.open(bypassUrl, '_blank');
            
            // Show instructions
            this.showError(`
                1. Click "Continue" on the page that opened
                2. Close that tab and return here
                3. The connection should work now
            `);
            
            // Retry connection after a short delay
            setTimeout(() => {
                this.checkBackendConnection();
            }, 3000);
        };
    }

    async sendMessage() {
        if (this.isProcessing) return;
        
        const message = this.elements.messageInput.value.trim();
        if (!message) return;
        
        if (!this.isConnected) {
            this.showError('Unable to connect to AI service. Please check your connection.');
            return;
        }

        this.isProcessing = true;
        this.elements.sendButton.disabled = true;
        this.elements.sendButton.style.display = 'none';
        this.elements.stopButton.style.display = 'block';
        this.elements.loading.classList.add('show');
        
        this.abortController = new AbortController();

        try {
            // Add user message
            this.addMessage('user', message);
            this.messageHistory.push({ role: 'user', content: message });

            const requestBody = {
                messages: [...this.messageHistory],
                max_tokens: parseInt(this.elements.maxTokens.value),
                temperature: parseFloat(this.elements.temperature.value)
            };
            
            // Add bypass parameter to chat endpoint as well
            const chatUrl = `${this.config.api.baseUrl}${this.config.api.endpoints.chat}?skip_zrok_interstitial=true`;
            
            const response = await fetch(chatUrl, {
                method: 'POST',
                headers: {
                    ...this.config.api.headers,
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify(requestBody),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`Service error: ${response.status}`);
            }

            // Handle streaming response
            const assistantMessageDiv = this.addMessage('assistant', '', true);
            const contentDiv = assistantMessageDiv.querySelector('.message-content');
            let fullResponse = '';

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && line.length > 6) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;
                        
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.choices?.[0]?.delta?.content) {
                                fullResponse += parsed.choices[0].delta.content;
                                contentDiv.innerHTML = marked.parse(fullResponse);
                                this.scrollToBottom();
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }

            this.messageHistory.push({ role: 'assistant', content: fullResponse });
            this.elements.messageInput.value = '';
            this.autoResizeTextarea();

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Generation stopped by user');
            } else if (error.message.includes('503') || error.message.includes('502')) {
                this.showError('AI service temporarily unavailable. Please try again in a moment.');
            } else if (error.message.includes('403')) {
                this.showError('Access denied. Please check the zrok configuration.');
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                this.showError('Network connection failed. Please check the zrok URL and try again.');
            } else {
                this.showError('Failed to get response. Please try again.');
                console.error('Chat error:', error);
            }
        } finally {
            this.isProcessing = false;
            this.elements.sendButton.disabled = false;
            this.elements.sendButton.style.display = 'block';
            this.elements.stopButton.style.display = 'none';
            this.elements.loading.classList.remove('show');
            this.abortController = null;
        }
    }

    addMessage(role, text, isStreaming = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (role === 'assistant') {
            if (text) {
                contentDiv.innerHTML = marked.parse(text);
            } else if (isStreaming) {
                contentDiv.innerHTML = '';
            }
        } else {
            const textP = document.createElement('p');
            textP.textContent = text;
            contentDiv.appendChild(textP);
        }

        messageDiv.appendChild(contentDiv);
        this.elements.messages.appendChild(messageDiv);
        this.scrollToBottom();

        return messageDiv;
    }

    stopGeneration() {
        if (this.abortController && this.isProcessing) {
            this.abortController.abort();
        }
    }

    scrollToBottom(force = false) {
        if (!this.userHasScrolled || force) {
            const container = this.elements.messages;
            container.scrollTop = container.scrollHeight;
            this.isNearBottom = true;
            this.userHasScrolled = false;
            this.updateScrollButton();
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        this.elements.messages.appendChild(errorDiv);
        this.scrollToBottom();
        
        setTimeout(() => {
            errorDiv.remove();
        }, this.config.ui.errorDisplayTime);
    }
}

// Initialize the chat application
document.addEventListener('DOMContentLoaded', () => {
    new GemmaChat();
});