class MinimalChat {
    constructor() {
        this.isConnected = false;
        this.isProcessing = false;
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
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            messages: document.getElementById('messages'),
            loading: document.getElementById('loading'),
            messageInput: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendButton'),
            stopButton: document.getElementById('stopButton'),
            scrollToBottomBtn: document.getElementById('scrollToBottom'),
            debugInfo: document.getElementById('debugInfo')
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
        this.autoResizeTextarea();
        setTimeout(() => this.handleScroll(), 100);
        
        // Display debug info
        this.showDebugInfo();
        
        // Try to preload zrok URL to bypass interstitial
        this.preloadZrokBypass();
        
        await this.checkConnection();
        
        setInterval(() => {
            this.checkConnection();
        }, this.config.ui.connectionCheckInterval);
    }

    preloadZrokBypass() {
        // Show user instruction for manual bypass
        const instructionDiv = document.createElement('div');
        instructionDiv.style.cssText = `
            position: fixed; 
            top: 10px; 
            left: 50%; 
            transform: translateX(-50%); 
            background: #ff6b35; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 5px; 
            z-index: 1000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        
        const zrokUrl = this.config.api.baseUrl;
        instructionDiv.innerHTML = `
            <div>⚠️ First-time setup required</div>
            <div style="margin: 5px 0;">
                <a href="${zrokUrl}" target="_blank" style="color: #fff; text-decoration: underline;">
                    Click here to bypass zrok interstitial
                </a>
            </div>
            <div style="font-size: 12px;">Then come back to use the chat</div>
        `;
        
        document.body.appendChild(instructionDiv);
        
        // Remove instruction after 10 seconds or when connection succeeds
        setTimeout(() => {
            if (instructionDiv.parentNode) {
                instructionDiv.remove();
            }
        }, 15000);
        
        // Remove instruction when connection is successful
        const originalUpdateStatus = this.updateConnectionStatus.bind(this);
        this.updateConnectionStatus = (connected, message) => {
            if (connected && instructionDiv.parentNode) {
                instructionDiv.remove();
            }
            originalUpdateStatus(connected, message);
        };
    }

    showDebugInfo() {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
        const fullUrl = this.config.api.baseUrl + this.config.api.endpoint;
        
        this.elements.debugInfo.innerHTML = `
            Host: ${hostname} | Local: ${isLocal} | URL: ${fullUrl}
        `;
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

    async checkConnection() {
        try {
            const response = await fetch(`${this.config.api.baseUrl}${this.config.api.endpoint}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'skip_zrok_interstitial': 'true'
                },
                body: JSON.stringify({ type: 'health' })
            });

            if (response.ok) {
                this.updateConnectionStatus(true, 'Connected');
            } else {
                this.updateConnectionStatus(false, `HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.updateConnectionStatus(false, `Connection failed: ${error.message}`);
        }
    }

    updateConnectionStatus(connected, message) {
        this.isConnected = connected;
        this.elements.statusDot.classList.toggle('connected', connected);
        this.elements.statusText.textContent = message;
    }

    async sendMessage() {
        if (this.isProcessing) return;
        
        const message = this.elements.messageInput.value.trim();
        if (!message) return;
        
        if (!this.isConnected) {
            this.showError('Unable to connect to service. Please try again.');
            return;
        }

        this.isProcessing = true;
        this.elements.sendButton.disabled = true;
        this.elements.sendButton.style.display = 'none';
        this.elements.stopButton.style.display = 'block';
        this.elements.loading.classList.add('show');
        
        this.abortController = new AbortController();

        try {
            this.addMessage('user', message);

            const response = await fetch(`${this.config.api.baseUrl}${this.config.api.endpoint}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'skip_zrok_interstitial': 'true'
                },
                body: JSON.stringify({ 
                    type: 'chat',
                    message: message
                }),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`Service error: ${response.status}`);
            }

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
                            if (parsed.content) {
                                fullResponse += parsed.content;
                                contentDiv.innerHTML = marked.parse(fullResponse);
                                this.scrollToBottom();
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }

            this.elements.messageInput.value = '';
            this.autoResizeTextarea();

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Generation stopped by user');
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

document.addEventListener('DOMContentLoaded', () => {
    new MinimalChat();
});