<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface $$Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
		size?: 'xs' | 'sm' | 'md' | 'lg';
		fullWidth?: boolean;
		loading?: boolean;
		icon?: boolean;
		class?: string;
	}

	export let variant: $$Props['variant'] = 'primary';
	export let size: $$Props['size'] = 'md';
	export let fullWidth: $$Props['fullWidth'] = false;
	export let loading: $$Props['loading'] = false;
	export let icon: $$Props['icon'] = false;
	export let disabled: $$Props['disabled'] = false;

	let className: string = '';
	export { className as class };

	$: computedDisabled = disabled || loading;
</script>

<button
	{...$$restProps}
	class="btn btn-{variant} btn-{size} {icon ? 'btn-icon' : ''} {fullWidth
		? 'btn-full-width'
		: ''} {loading ? 'btn-loading' : ''} {className}"
	disabled={computedDisabled}
	on:click
>
	{#if loading}
		<div class="btn-spinner" aria-hidden="true"></div>
	{/if}
	<slot />
</button>

<style>
	/* Base Button Styles */
	.btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid transparent;
		font-family: var(--font-family-sans);
		font-weight: var(--font-weight-medium);
		text-decoration: none;
		cursor: pointer;
		transition: all var(--transition-fast);
		user-select: none;
		white-space: nowrap;
		vertical-align: middle;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}

	.btn:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.btn:focus:not(:focus-visible) {
		outline: none;
	}

	.btn:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Button Sizes */
	.btn-xs {
		padding: var(--spacing-xs) var(--spacing-sm);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-tight);
		border-radius: var(--radius-sm);
		gap: var(--spacing-xs);
	}

	.btn-sm {
		padding: var(--spacing-sm) var(--spacing-md);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-snug);
		border-radius: var(--radius-md);
		gap: var(--spacing-xs);
	}

	.btn-md {
		padding: var(--spacing-md) var(--spacing-xl);
		font-size: var(--font-size-base);
		line-height: var(--line-height-normal);
		border-radius: var(--radius-lg);
		gap: var(--spacing-sm);
	}

	.btn-lg {
		padding: var(--spacing-lg) var(--spacing-2xl);
		font-size: var(--font-size-lg);
		line-height: var(--line-height-normal);
		border-radius: var(--radius-xl);
		gap: var(--spacing-md);
	}

	/* Icon Button Adjustments */
	.btn-icon.btn-xs {
		padding: var(--spacing-xs);
		width: 1.5rem;
		height: 1.5rem;
	}

	.btn-icon.btn-sm {
		padding: var(--spacing-sm);
		width: 2rem;
		height: 2rem;
	}

	.btn-icon.btn-md {
		padding: var(--spacing-md);
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-full);
	}

	.btn-icon.btn-lg {
		padding: var(--spacing-lg);
		width: 3rem;
		height: 3rem;
	}

	/* Button Variants */
	.btn-primary {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-text-inverse);
	}

	.btn-primary:hover:not(:disabled) {
		background-color: var(--color-primary-hover);
		border-color: var(--color-primary-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.btn-primary:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.btn-secondary {
		background-color: var(--color-surface-primary);
		border-color: var(--color-border-primary);
		color: var(--color-text-primary);
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: var(--color-surface-tertiary);
		border-color: var(--color-border-secondary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.btn-secondary:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.btn-ghost {
		background-color: transparent;
		border-color: transparent;
		color: var(--color-text-secondary);
	}

	.btn-ghost:hover:not(:disabled) {
		background-color: var(--color-surface-tertiary);
		color: var(--color-text-primary);
	}

	.btn-ghost:active:not(:disabled) {
		background-color: var(--color-surface-secondary);
	}

	.btn-danger {
		background-color: var(--color-error);
		border-color: var(--color-error);
		color: var(--color-text-inverse);
	}

	.btn-danger:hover:not(:disabled) {
		background-color: #c82333;
		border-color: #c82333;
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.btn-danger:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.btn-success {
		background-color: var(--color-success);
		border-color: var(--color-success);
		color: var(--color-text-inverse);
	}

	.btn-success:hover:not(:disabled) {
		background-color: #218838;
		border-color: #218838;
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.btn-success:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	/* Full Width */
	.btn-full-width {
		width: 100%;
	}

	/* Loading State */
	.btn-loading {
		pointer-events: none;
	}

	.btn-spinner {
		position: absolute;
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: var(--radius-full);
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* When loading, hide button content */
	.btn-loading :global(*:not(.btn-spinner)) {
		opacity: 0;
	}
</style>