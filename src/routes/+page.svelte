<script lang="ts">
	import '$lib/styles/design-system.css';
	import { chat } from '$lib/features/chat/stores/chatStore';
	import ChatMessage from '$lib/features/chat/components/ChatMessage.svelte';
	import SettingsModal from '$lib/features/chat/components/SettingsModal.svelte';
	import { Button, Typography } from '$lib/components';

	let userInput = '';
	let chatContainer: HTMLElement;
	let showSettings = false;

	// Reactive variables for better readability in the template
	$: messages = $chat.messages;
	$: isLoading = $chat.isLoading;
	// **FIX:** A more robust condition for showing the regenerate button
	$: canRegenerate =
		!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant';

	$: if (messages) {
		scrollToBottom();
	}

	function handleSubmit() {
		chat.sendMessage(userInput, messages);
		userInput = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}

	function scrollToBottom() {
		setTimeout(() => {
			chatContainer?.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
		}, 100);
	}
</script>

{#if showSettings}
	<SettingsModal on:close={() => (showSettings = false)} />
{/if}

<div class="app-container">
	<header class="app-header">
		<div class="header-content">
			<Typography as="h1" variant="heading-lg" weight="semibold">Svelte AI Chat</Typography>
			<Typography variant="body-sm" color="secondary">Powered by a local Llama model</Typography>
		</div>
		<div class="header-actions">
			<Button
				variant="secondary"
				size="sm"
				on:click={() => (showSettings = true)}
				title="Edit system prompt"
			>
				Settings
			</Button>
			<Button
				variant="secondary"
				size="sm"
				on:click={chat.newChat}
				title="Start a new chat"
			>
				New Chat
			</Button>
		</div>
	</header>

	<div class="chat-window" bind:this={chatContainer}>
		{#each messages as message (message.id)}
			<ChatMessage {message} />
		{/each}
	</div>

	<footer class="input-area">
		{#if isLoading}
			<div class="action-button-container">
				<Button variant="danger" size="sm" on:click={chat.stopGeneration}>
					Stop Generating
				</Button>
			</div>
		{:else if canRegenerate}
			<div class="action-button-container">
				<Button variant="secondary" size="sm" on:click={chat.regenerateLastResponse}>
					Regenerate
				</Button>
			</div>
		{/if}
		<div class="input-wrapper">
			<textarea
				rows="1"
				bind:value={userInput}
				on:keydown={handleKeydown}
				on:input={(e) => {
					const target = e.target as HTMLTextAreaElement;
					target.style.height = 'auto';
					target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
				}}
				placeholder="Type your message here..."
				disabled={isLoading}
				class="message-input"
			></textarea>
			<Button
				variant="primary"
				size="md"
				icon
				on:click={handleSubmit}
				disabled={isLoading || !userInput.trim()}
				aria-label="Send message"
				class="send-button"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
					<path d="M.5 7.5a.5.5 0 0 1 .5-.5h12.5a.5.5 0 0 1 0 1H1a.5.5 0 0 1-.5-.5zM1 8a.5.5 0 0 1 .5.5v3.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L1 12.293V8.5A.5.5 0 0 1 1 8z" />
				</svg>
			</Button>
		</div>
	</footer>
</div>

<style>
	/* App Layout */
	.app-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 800px;
		height: 100vh;
		margin: 0 auto;
		background-color: var(--color-surface-primary);
		box-shadow: var(--shadow-xl);
		font-family: var(--font-family-sans);
	}

	/* Header */
	.app-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-xl) var(--spacing-2xl);
		border-bottom: 1px solid var(--color-border-primary);
		background-color: var(--color-surface-primary);
		flex-shrink: 0;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.header-actions {
		display: flex;
		gap: var(--spacing-md);
	}

	/* Chat Window */
	.chat-window {
		flex-grow: 1;
		overflow-y: auto;
		padding: var(--spacing-2xl);
		background-color: var(--color-surface-secondary);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	/* Input Area */
	.input-area {
		padding: var(--spacing-lg) var(--spacing-2xl);
		border-top: 1px solid var(--color-border-primary);
		background-color: var(--color-surface-primary);
		flex-shrink: 0;
	}

	.action-button-container {
		display: flex;
		justify-content: center;
		margin-bottom: var(--spacing-md);
	}

	.input-wrapper {
		display: flex;
		gap: var(--spacing-md);
		align-items: flex-end;
	}

	.message-input {
		flex-grow: 1;
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-3xl);
		padding: var(--spacing-md) var(--spacing-xl);
		font-size: var(--font-size-base);
		font-family: var(--font-family-sans);
		line-height: var(--line-height-normal);
		background-color: var(--color-surface-primary);
		color: var(--color-text-primary);
		resize: none;
		max-height: 150px;
		transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
	}

	.message-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-light);
	}

	.message-input::placeholder {
		color: var(--color-text-tertiary);
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.app-header {
			padding: var(--spacing-lg) var(--spacing-lg);
		}

		.header-actions {
			gap: var(--spacing-sm);
		}

		.chat-window {
			padding: var(--spacing-lg);
		}

		.input-area {
			padding: var(--spacing-md) var(--spacing-lg);
		}

		.input-wrapper {
			gap: var(--spacing-sm);
		}
	}
</style>
