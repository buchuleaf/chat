document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const promptInput = document.getElementById('prompt-input');
    const chatBox = document.getElementById('chat-box');
    const sendButton = document.getElementById('send-button');

    // IMPORTANT: Replace this with the actual URL of your backend.
    // If you are running the backend on the same machine for development,
    // this will be http://<your-machine-ip>:5000
    // For production, this will be your deployed backend URL.
    const BACKEND_URL = 'http://127.0.0.1:5000/api/generate';

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = promptInput.value.trim();
        if (!prompt) return;

        // Disable form and show loading state
        promptInput.value = '';
        promptInput.disabled = true;
        sendButton.disabled = true;

        // Display user's message
        addMessage(prompt, 'user');

        // Create a placeholder for the assistant's response
        const assistantMessageElement = addMessage('...', 'assistant');
        const assistantParagraph = assistantMessageElement.querySelector('p');
        assistantParagraph.textContent = ''; // Clear the placeholder text

        try {
            const eventSource = new EventSource(`${BACKEND_URL}?prompt=${encodeURIComponent(prompt)}`, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({ prompt: prompt })
            });

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.content) {
                    // Append the content chunk to the paragraph
                    assistantParagraph.textContent += data.content;
                    // Scroll to the bottom of the chat box
                    chatBox.scrollTop = chatBox.scrollHeight;
                }
            };

            eventSource.onerror = (err) => {
                console.error("EventSource failed:", err);
                let errorMessage = "Error connecting to the AI. Please try again later.";
                if (eventSource.readyState === EventSource.CLOSED) {
                     // Check if any text was generated before the connection closed
                    if (assistantParagraph.textContent.trim() === '') {
                         assistantParagraph.textContent = errorMessage;
                    }
                }
                eventSource.close();
                enableForm();
            };

            eventSource.addEventListener('close', () => {
                eventSource.close();
                enableForm();
            });


        } catch (error) {
            console.error('Error:', error);
            assistantParagraph.textContent = "Failed to get a response from the server.";
            enableForm();
        }
    });

    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        const paragraphElement = document.createElement('p');
        paragraphElement.textContent = text;
        messageElement.appendChild(paragraphElement);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageElement;
    }

    function enableForm() {
        promptInput.disabled = false;
        sendButton.disabled = false;
        promptInput.focus();
    }

    // Auto-resize textarea
    promptInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
});