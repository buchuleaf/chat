<script lang="ts">
	import { tick } from 'svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { chat } from '$lib/features/chat/stores/chatStore';
	import type { Message } from '$lib/features/chat/types';
	import { Button } from '$lib/components';

	export let message: Message;

	let element: HTMLElement;
	let displayedContent = '';
	let editContent = message.content;

	$: {
		displayedContent = message.content;
	}

	function handleCodeSnippets(node: HTMLElement) {
		setTimeout(() => {
			const snippets = node.querySelectorAll('pre');
			snippets.forEach((pre) => {
				if (pre.parentElement?.tagName === 'DIV' && pre.parentElement.style.position === 'relative')
					return;
				const code = pre.querySelector('code');
				if (!code) return;
				const wrapper = document.createElement('div');
				wrapper.style.position = 'relative';
				pre.parentNode?.insertBefore(wrapper, pre);
				wrapper.appendChild(pre);
				const button = document.createElement('button');
				button.textContent = 'Copy';
				button.className = 'copy-button';
				button.onclick = () => {
					navigator.clipboard.writeText(code.textContent ?? '').then(() => {
						button.textContent = 'Copied!';
						setTimeout(() => {
							button.textContent = 'Copy';
						}, 2000);
					});
				};
				wrapper.appendChild(button);
			});
		}, 0);
	}

	async function getRenderedHtml(content: string): Promise<string> {
		if (typeof window === 'undefined') return `<p>${content}</p>`;
		const rawMarkup = await marked.parse(content);
		return DOMPurify.sanitize(rawMarkup);
	}

	function handleSaveEdit() {
		chat.editAndResubmit(message.id, editContent);
	}

	function handleCancelEdit() {
		chat.toggleEditMode(message.id);
		editContent = message.content;
	}
</script>

<div class="message-wrapper {message.role}" bind:this={element}>
	{#if message.isEditing}
		<div class="edit-container">
			<textarea bind:value={editContent} rows="3" class="edit-textarea"></textarea>
			<div class="edit-actions">
				<Button variant="secondary" size="sm" on:click={handleCancelEdit}>Cancel</Button>
				<Button variant="primary" size="sm" on:click={handleSaveEdit}>Save & Submit</Button>
			</div>
		</div>
	{:else}
		<div class="message" use:handleCodeSnippets>
			{#if message.role === 'thinking'}
				<div class="loading-dots"><span></span><span></span><span></span></div>
			{:else}
				{#await getRenderedHtml(displayedContent)}
					<span></span>
				{:then renderedHtml}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html renderedHtml}
				{/await}
			{/if}
		</div>
		{#if message.role === 'user'}
			<Button
				variant="ghost"
				size="sm"
				icon
				on:click={() => chat.toggleEditMode(message.id)}
				aria-label="Edit prompt"
				title="Edit prompt"
				class="edit-button"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
					<path d="M12.621 2.621a1 1 0 0 0-1.414 0L2.586 11.207a.997.997 0 0 0-.293.707V13.5a.5.5 0 0 0 .5.5h1.586c.265 0 .52-.105.707-.293l8.621-8.621a1 1 0 0 0 0-1.414l-1.586-1.586zM12.5 4.03l-1.586-1.586L12 1.414 13.586 3 12.5 4.03zM3.5 13v-1.086l7.5-7.5L12.086 5.5l-7.5 7.5H3.5z" />
				</svg>
			</Button>
		{/if}
	{/if}
</div>

<style>
	/* Message Container */
	.message-wrapper {
		display: flex;
		max-width: 85%;
		animation: fade-in 0.3s ease-out;
	}

	.message-wrapper.user {
		margin-left: auto;
		justify-content: flex-end;
	}

	.message-wrapper.assistant,
	.message-wrapper.error {
		margin-right: auto;
		justify-content: flex-start;
	}

	/* Message Bubble */
	.message {
		padding: var(--spacing-md) var(--spacing-xl);
		border-radius: var(--radius-2xl);
		line-height: var(--line-height-relaxed);
		word-wrap: break-word;
		position: relative;
		font-size: var(--font-size-base);
		box-shadow: var(--shadow-sm);
	}

	.message-wrapper.user .message {
		background-color: var(--color-primary);
		color: var(--color-text-inverse);
		border-bottom-right-radius: var(--radius-lg);
	}

	.message-wrapper.assistant .message {
		background-color: var(--color-surface-tertiary);
		color: var(--color-text-primary);
		border-bottom-left-radius: var(--radius-lg);
		border: 1px solid var(--color-border-secondary);
	}

	.message-wrapper.error .message {
		background-color: var(--color-error-light);
		color: var(--color-error);
		border: 1px solid var(--color-error);
		border-bottom-left-radius: var(--radius-lg);
	}

	/* Loading Animation */
	.loading-dots {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) 0;
	}

	.loading-dots span {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: var(--radius-full);
		background-color: var(--color-text-secondary);
		animation: loading-pulse 1.4s infinite both;
	}

	.loading-dots span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.loading-dots span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes loading-pulse {
		0%, 80%, 100% {
			opacity: 0.4;
			transform: scale(0.8);
		}
		40% {
			opacity: 1;
			transform: scale(1.2);
		}
	}

	/* Copy Button for Code Blocks */
	:global(.copy-button) {
		position: absolute;
		top: var(--spacing-sm);
		right: var(--spacing-sm);
		background-color: var(--color-gray-800);
		color: var(--color-text-inverse);
		border: none;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-md);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		opacity: 0;
		transition: opacity var(--transition-fast);
		z-index: 10;
	}

	:global(div[style*='position: relative']:hover .copy-button) {
		opacity: 1;
	}

	:global(.copy-button:hover) {
		background-color: var(--color-gray-700);
	}

	/* Edit Mode */
	.edit-container {
		width: 100%;
		max-width: 100%;
	}

	.edit-textarea {
		width: 100%;
		border: 1px solid var(--color-border-focus);
		border-radius: var(--radius-xl);
		padding: var(--spacing-md);
		font-family: var(--font-family-sans);
		font-size: var(--font-size-base);
		line-height: var(--line-height-normal);
		background-color: var(--color-surface-primary);
		color: var(--color-text-primary);
		resize: vertical;
		min-height: 80px;
		margin-bottom: var(--spacing-md);
		transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
	}

	.edit-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-light);
	}

	.edit-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-md);
	}

	/* Edit Button Positioning */
	.message-wrapper :global(.edit-button) {
		align-self: center;
		margin-left: var(--spacing-sm);
		opacity: 0.6;
		transition: opacity var(--transition-fast);
	}

	.message-wrapper:hover :global(.edit-button) {
		opacity: 1;
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.message-wrapper {
			max-width: 95%;
		}

		.message {
			padding: var(--spacing-sm) var(--spacing-md);
		}

		.edit-actions {
			gap: var(--spacing-sm);
		}

		.message-wrapper :global(.edit-button) {
			margin-left: var(--spacing-xs);
		}
	}

	/* Fade-in Animation */
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
