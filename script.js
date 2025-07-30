document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const promptInput = document.getElementById('prompt-input');
    const chatBox = document.getElementById('chat-box');
    const sendButton = document.getElementById('send-button');

    // This URL should be correct in your repository.
    // Example: const BACKEND_URL = 'https://7jlhq0nn7aib.share.zrok.io/api/generate';
    const BACKEND_URL = 'https://7jlhq0nn7aib.share.zrok.io'; // Replace with your actual zrok URL if different

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

    const handleSendMessage = async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) return;

        setFormState(true); // Disable form
        addMessage(prompt, 'user');
        promptInput.value = '';
        autoResizeTextarea();

        const assistantMessageElement = addMessage('', 'assistant');
        const assistantParagraph = assistantMessageElement.querySelector('p');
        assistantParagraph.textContent = '▍'; // Initial cursor

        try {
            const response = await fetch(`${BACKEND_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            // The response body is a ReadableStream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            // The first character is the cursor, so remove it
            if (assistantParagraph.textContent === '▍') {
                assistantParagraph.textContent = '';
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                // Decode the chunk of data and add it to our buffer
                buffer += decoder.decode(value, { stream: true });
                
                // Process complete "data: ..." lines from the buffer
                let eolIndex;
                while ((eolIndex = buffer.indexOf('\n')) >= 0) {
                    const line = buffer.substring(0, eolIndex).trim();
                    buffer = buffer.substring(eolIndex + 1);

                    if (line.startsWith('data:')) {
                        const jsonStr = line.substring(5).trim();
                        try {
                            const data = JSON.parse(jsonStr);
                            if (data.content) {
                                assistantParagraph.textContent += data.content;
                                scrollToBottom();
                            }
                            if (data.stop) {
                                // Stop signal received from the server
                                reader.cancel();
                                break;
                            }
                        } catch (e) {
                            console.error('Failed to parse JSON from stream:', jsonStr);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Fetch failed:', error);
            assistantParagraph.textContent = `Error: ${error.message}`;
        } finally {
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