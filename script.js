document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const promptInput = document.getElementById('prompt-input');
    const chatBox = document.getElementById('chat-box');
    const sendButton = document.getElementById('send-button');

    // ==============================================================================
    // CRITICAL: Replace this with the public URL provided by zrok when you run it.
    // Example: const BACKEND_URL = 'https://abc123def456.zrok.io/api/generate';
    // ==============================================================================
    const BACKEND_URL = 'https://fzmi4mr7w9f5.share.zrok.io';

    let eventSource;

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSendMessage();
    });

    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    const handleSendMessage = () => {
        const prompt = promptInput.value.trim();
        if (!prompt) return;

        setFormState(true); // Disable form
        addMessage(prompt, 'user');
        promptInput.value = '';
        autoResizeTextarea(); // Reset textarea height

        const assistantMessageElement = addMessage('', 'assistant');
        const assistantParagraph = assistantMessageElement.querySelector('p');

        try {
            // Close any existing connection before starting a new one
            if (eventSource) {
                eventSource.close();
            }

            eventSource = new EventSource(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            assistantParagraph.textContent = '▍'; // Initial cursor

            eventSource.onmessage = (event) => {
                // The first character is the cursor, so remove it
                if (assistantParagraph.textContent === '▍') {
                    assistantParagraph.textContent = '';
                }
                
                // llama.cpp streams JSON objects with a 'data: ' prefix
                const data = JSON.parse(event.data);
                if (data.content) {
                    assistantParagraph.textContent += data.content;
                    scrollToBottom();
                }
                if (data.stop) {
                    eventSource.close();
                    setFormState(false); // Re-enable form
                }
            };

            eventSource.onerror = (err) => {
                console.error("EventSource failed:", err);
                assistantParagraph.textContent = "Error: Could not connect to the AI service. Please check the backend and zrok status.";
                eventSource.close();
                setFormState(false); // Re-enable form
            };

        } catch (error) {
            console.error('Error setting up EventSource:', error);
            assistantParagraph.textContent = "Error: Failed to initiate a connection with the server.";
            setFormState(false); // Re-enable form
        }
    };

    const addMessage = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        const paragraphElement = document.createElement('p');
        paragraphElement.textContent = text;
        messageElement.appendChild(paragraphElement);
        chatBox.appendChild(messageElement);
        scrollToBottom();
        return messageElement;
    };

    const setFormState = (isDisabled) => {
        promptInput.disabled = isDisabled;
        sendButton.disabled = isDisabled;
        if (!isDisabled) {
            promptInput.focus();
        }
    };

    const scrollToBottom = () => {
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const autoResizeTextarea = () => {
        promptInput.style.height = 'auto';
        promptInput.style.height = (promptInput.scrollHeight) + 'px';
    };

    promptInput.addEventListener('input', autoResizeTextarea);
    autoResizeTextarea();
});