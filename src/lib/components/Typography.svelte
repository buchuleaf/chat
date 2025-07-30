<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	type Element = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label';
	type Variant = 
		| 'display-lg' | 'display-md' | 'display-sm'
		| 'heading-lg' | 'heading-md' | 'heading-sm'
		| 'body-lg' | 'body-md' | 'body-sm' | 'body-xs'
		| 'caption' | 'overline';
	type Color = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'inverse' | 'success' | 'warning' | 'error';
	type Weight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold';

	interface $$Props extends HTMLAttributes<HTMLElement> {
		as?: Element;
		variant?: Variant;
		color?: Color;
		weight?: Weight;
		truncate?: boolean;
		center?: boolean;
		class?: string;
	}

	export let as: $$Props['as'] = 'p';
	export let variant: $$Props['variant'] = 'body-md';
	export let color: $$Props['color'] = 'primary';
	export let weight: $$Props['weight'] = undefined;
	export let truncate: $$Props['truncate'] = false;
	export let center: $$Props['center'] = false;

	let className: string = '';
	export { className as class };

	$: computedClass = [
		'typography',
		`typography-${variant}`,
		`typography-color-${color}`,
		weight && `typography-weight-${weight}`,
		truncate && 'typography-truncate',
		center && 'typography-center',
		className
	].filter(Boolean).join(' ');
</script>

<svelte:element 
	this={as} 
	{...$$restProps}
	class={computedClass}
>
	<slot />
</svelte:element>

<style>
	/* Base Typography Styles */
	.typography {
		margin: 0;
		color: var(--color-text-primary);
		font-family: var(--font-family-sans);
	}

	/* Display Variants */
	.typography-display-lg {
		font-size: var(--font-size-4xl);
		line-height: var(--line-height-tight);
		font-weight: var(--font-weight-bold);
		letter-spacing: -0.02em;
	}

	.typography-display-md {
		font-size: var(--font-size-3xl);
		line-height: var(--line-height-tight);
		font-weight: var(--font-weight-bold);
		letter-spacing: -0.02em;
	}

	.typography-display-sm {
		font-size: var(--font-size-2xl);
		line-height: var(--line-height-snug);
		font-weight: var(--font-weight-bold);
		letter-spacing: -0.01em;
	}

	/* Heading Variants */
	.typography-heading-lg {
		font-size: var(--font-size-xl);
		line-height: var(--line-height-snug);
		font-weight: var(--font-weight-semibold);
	}

	.typography-heading-md {
		font-size: var(--font-size-lg);
		line-height: var(--line-height-snug);
		font-weight: var(--font-weight-semibold);
	}

	.typography-heading-sm {
		font-size: var(--font-size-base);
		line-height: var(--line-height-snug);
		font-weight: var(--font-weight-semibold);
	}

	/* Body Variants */
	.typography-body-lg {
		font-size: var(--font-size-lg);
		line-height: var(--line-height-relaxed);
		font-weight: var(--font-weight-normal);
	}

	.typography-body-md {
		font-size: var(--font-size-base);
		line-height: var(--line-height-normal);
		font-weight: var(--font-weight-normal);
	}

	.typography-body-sm {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-normal);
		font-weight: var(--font-weight-normal);
	}

	.typography-body-xs {
		font-size: var(--font-size-xs);
		line-height: var(--line-height-normal);
		font-weight: var(--font-weight-normal);
	}

	/* Special Variants */
	.typography-caption {
		font-size: var(--font-size-xs);
		line-height: var(--line-height-tight);
		font-weight: var(--font-weight-normal);
		color: var(--color-text-secondary);
	}

	.typography-overline {
		font-size: var(--font-size-xs);
		line-height: var(--line-height-tight);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-secondary);
	}

	/* Color Variants */
	.typography-color-primary {
		color: var(--color-text-primary);
	}

	.typography-color-secondary {
		color: var(--color-text-secondary);
	}

	.typography-color-tertiary {
		color: var(--color-text-tertiary);
	}

	.typography-color-muted {
		color: var(--color-text-muted);
	}

	.typography-color-inverse {
		color: var(--color-text-inverse);
	}

	.typography-color-success {
		color: var(--color-success);
	}

	.typography-color-warning {
		color: var(--color-warning);
	}

	.typography-color-error {
		color: var(--color-error);
	}

	/* Font Weight Overrides */
	.typography-weight-light {
		font-weight: var(--font-weight-light);
	}

	.typography-weight-normal {
		font-weight: var(--font-weight-normal);
	}

	.typography-weight-medium {
		font-weight: var(--font-weight-medium);
	}

	.typography-weight-semibold {
		font-weight: var(--font-weight-semibold);
	}

	.typography-weight-bold {
		font-weight: var(--font-weight-bold);
	}

	/* Utility Classes */
	.typography-truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.typography-center {
		text-align: center;
	}

	/* Responsive Typography */
	@media (max-width: 640px) {
		.typography-display-lg {
			font-size: var(--font-size-3xl);
		}

		.typography-display-md {
			font-size: var(--font-size-2xl);
		}

		.typography-display-sm {
			font-size: var(--font-size-xl);
		}

		.typography-heading-lg {
			font-size: var(--font-size-lg);
		}
	}
</style>