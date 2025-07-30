<script lang="ts">
	import { onMount } from 'svelte';
	import { chat } from '$lib/features/chat/stores/chatStore';
	import { createEventDispatcher } from 'svelte';
	import { Button, Typography } from '$lib/components';

	const dispatch = createEventDispatcher();

	let dialogElement: HTMLDialogElement;
	let systemPromptValue = '';
	const unsubscribe = chat.subscribe((s) => (systemPromptValue = s.systemPrompt));

	onMount(() => {
		dialogElement.showModal(); // Open the dialog programmatically
		return () => unsubscribe(); // Clean up the subscription
	});

	function handleSave() {
		chat.updateSystemPrompt(systemPromptValue);
		handleClose();
	}

	function handleClose() {
		dialogElement.close();
		dispatch('close');
	}

	// Function to close the dialog when clicking on the backdrop
	function handleBackdropClick(event: MouseEvent) {
		const rect = dialogElement.getBoundingClientRect();
		const isInDialog =
			rect.top <= event.clientY &&
			event.clientY <= rect.top + rect.height &&
			rect.left <= event.clientX &&
			event.clientX <= rect.left + rect.width;
		if (!isInDialog) {
			handleClose();
		}
	}
</script>

<!-- **FIX:** Use the semantic <dialog> element for accessibility -->
<dialog bind:this={dialogElement} class="modal-backdrop" on:click={handleBackdropClick}>
	<div class="modal-content">
		<Typography as="h2" variant="heading-lg" weight="semibold" class="modal-title">
			Settings
		</Typography>
		
		<div class="form-group">
			<label class="form-label" for="system-prompt">
				Personality
			</label>
			<Typography variant="body-xs" color="secondary" class="form-description">
				Customize how Gonk responds to you.
			</Typography>
			<textarea 
				id="system-prompt" 
				bind:value={systemPromptValue} 
				rows="8"
				class="form-textarea"
				placeholder="Tell Gonk how to behave..."
			></textarea>
		</div>
		
		<div class="modal-actions">
			<Button variant="secondary" on:click={handleClose}>Cancel</Button>
			<Button variant="primary" on:click={handleSave}>Save and Close</Button>
		</div>
	</div>
</dialog>

<style>
	/* Modal Backdrop */
	dialog.modal-backdrop {
		border: none;
		padding: 0;
		background-color: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(2px);
		z-index: var(--z-modal-backdrop);
	}

	dialog.modal-backdrop::backdrop {
		background-color: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(2px);
	}

	/* Modal Content */
	.modal-content {
		background: var(--color-surface-primary);
		padding: var(--spacing-2xl) var(--spacing-3xl);
		border-radius: var(--radius-2xl);
		width: 90%;
		max-width: 600px;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: var(--shadow-2xl);
		border: 1px solid var(--color-border-secondary);
		animation: modal-appear 0.2s ease-out;
		z-index: var(--z-modal);
	}

	@keyframes modal-appear {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	/* Form Elements */
	.form-group {
		margin-bottom: var(--spacing-xl);
	}

	.form-label {
		display: block;
		margin-bottom: var(--spacing-xs);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
	}

	.modal-content :global(.modal-title) {
		margin: 0 0 var(--spacing-2xl) 0;
	}

	.form-group :global(.form-description) {
		margin-bottom: var(--spacing-md);
	}

	.form-textarea {
		width: 100%;
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-xl);
		padding: var(--spacing-md);
		font-family: var(--font-family-sans);
		font-size: var(--font-size-base);
		line-height: var(--line-height-normal);
		background-color: var(--color-surface-primary);
		color: var(--color-text-primary);
		resize: vertical;
		min-height: 120px;
		transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
	}

	.form-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-light);
	}

	.form-textarea::placeholder {
		color: var(--color-text-tertiary);
	}

	/* Modal Actions */
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-md);
		margin-top: var(--spacing-2xl);
		padding-top: var(--spacing-xl);
		border-top: 1px solid var(--color-border-secondary);
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.modal-content {
			padding: var(--spacing-xl) var(--spacing-lg);
			width: 95%;
			max-height: 90vh;
		}

		.modal-actions {
			flex-direction: column-reverse;
			gap: var(--spacing-sm);
		}

		.modal-actions :global(button) {
			width: 100%;
		}
	}

	/* Focus trap for accessibility */
	dialog[open] {
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
