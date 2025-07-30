<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { env } from '$env/dynamic/public';

	type Message = {
		role: 'user' | 'assistant';
		content: string;
	};

	const BACKEND_API_URL = env.PUBLIC_NGROK_API_URL;

	let messages: Message[] = [
		{ role: 'assistant', content: 'Hello! I am a helpful AI assistant. How can I help you today?' }
	];
	let userInput = '';
	let isLoading = false;
	let chatContainer: HTMLElement;

	onMount(() => {
		if (typeof window !== 'undefined') {
			DOMPurify.setConfig({ USE_PROFILES: { html: true } });
		}
	});

	function scrollToBottom() {
		setTimeout(() => {
			chatContainer?.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
		}, 100);
	}

	async function handleSubmit() {
		if (!userInput.trim() || isLoading) return;
		const userMessage: Message = { role: 'user', content: userInput };
		messages = [...messages, userMessage];
		userInput = '';
		isLoading = true;
		scrollToBottom();

		const assistantResponse: Message = { role: 'assistant', content: '' };
		messages = [...messages, assistantResponse];

		try {
			if (!BACKEND_API_URL) {
				throw new Error('The backend API URL is not configured. Please check deployment settings.');
			}
			const response = await fetch(BACKEND_API_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'text/plain' },
				body: JSON.stringify({ messages: messages.slice(0, -1).map(({ role, content }) => ({ role, content })) })
			});

			if (!response.ok || !response.body) {
				throw new Error(`Server responded with status: ${response.status}`);
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;
				const chunk = decoder.decode(value, { stream: true });
				messages[messages.length - 1].content += chunk;
				messages = messages;
				scrollToBottom();
			}
		} catch (error: any) {
			messages[messages.length - 1].content = `**Error:** ${error.message}`;
			messages = messages;
		} finally {
			isLoading = false;
		}
	}

	async function renderMarkdown(content: string): Promise<string> {
		if (typeof window === 'undefined') return content;
		const rawMarkup = await marked.parse(content);
		return DOMPurify.sanitize(rawMarkup);
	}
</script>

<div class="app-container">
	<header class="app-header">
		<h1>Svelte AI Chat</h1>
		<p>Powered by a local Llama model</p>
	</header>

	<div class="chat-window" bind:this={chatContainer}>
		{#each messages as message, i (i)}
			<div class="message-wrapper {message.role}">
				<div class="message">
					{#await renderMarkdown(message.content)}
						<p>...</p> <!-- Optional: Show a loading state -->
					{:then renderedHtml}
						{@html renderedHtml}
					{:catch error}
						<p class="error-message">Error rendering content: {error.message}</p>
					{/await}

					{#if isLoading && i === messages.length - 1 && message.content === ''}
						<!-- THIS IS THE CORRECTED LINE -->
						<span class="blinking-cursor"></span>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<footer class="input-area">
		<form on:submit|preventDefault={handleSubmit}>
			<input
				type="text"
				bind:value={userInput}
				placeholder="Type your message here..."
				disabled={isLoading}
				aria-label="Chat input"
			/>
			<button type="submit" disabled={isLoading} aria-label="Send message">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
					><path
						d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"
					/></svg
				>
			</button>
		</form>
	</footer>
</div>

<style>
	:root {
		--bg-color: #f0f2f5;
		--app-bg: #ffffff;
		--header-bg: #f8f9fa;
		--user-msg-bg: #007bff;
		--assistant-msg-bg: #e9ecef;
		--text-color: #212529;
		--border-color: #dee2e6;
		--shadow-color: rgba(0, 0, 0, 0.05);
	}

	.app-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 800px;
		height: 100vh;
		background-color: var(--app-bg);
		box-shadow: 0 4px 20px var(--shadow-color);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			'Open Sans', 'Helvetica Neue', sans-serif;
	}

	.app-header {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border-color);
		text-align: center;
		background-color: var(--header-bg);
	}

	.app-header h1 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--text-color);
	}

	.app-header p {
		margin: 0;
		font-size: 0.8rem;
		color: #6c757d;
	}

	.chat-window {
		flex-grow: 1;
		overflow-y: auto;
		padding: 1.5rem;
		background-color: var(--bg-color);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.message-wrapper {
		display: flex;
		max-width: 80%;
	}

	.message-wrapper.user {
		margin-left: auto;
		justify-content: flex-end;
	}

	.message-wrapper.assistant {
		margin-right: auto;
		justify-content: flex-start;
	}

	.message {
		padding: 0.75rem 1.25rem;
		border-radius: 1.25rem;
		line-height: 1.6;
	}

	.message-wrapper.user .message {
		background-color: var(--user-msg-bg);
		color: white;
		border-bottom-right-radius: 0.5rem;
	}

	.message-wrapper.assistant .message {
		background-color: var(--assistant-msg-bg);
		color: var(--text-color);
		border-bottom-left-radius: 0.5rem;
	}

    .error-message {
        background-color: #ffebee;
        color: #c62828;
    }
	
	.input-area {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border-color);
		background-color: var(--header-bg);
	}

	.input-area form {
		display: flex;
		gap: 0.75rem;
	}

	.input-area input {
		flex-grow: 1;
		border: 1px solid var(--border-color);
		border-radius: 2rem;
		padding: 0.75rem 1.25rem;
		font-size: 1rem;
		outline: none;
		transition: border-color 0.2s;
	}

	.input-area input:focus {
		border-color: var(--user-msg-bg);
	}

	.input-area button {
		border: none;
		background-color: var(--user-msg-bg);
		color: white;
		border-radius: 50%;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.input-area button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.input-area button svg {
		width: 1.5rem;
		height: 1.5rem;
	}

	.blinking-cursor {
        display: inline-block;
        width: 8px;
        height: 1.2rem;
        background-color: var(--text-color);
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		from,
		to {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}
</style>