<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	let fps = 120;
	let fpsElement: HTMLElement;

	onMount(() => {
		const duration = 2000; // 2 seconds
		const startTime = performance.now();
		const totalSteps = 120; // We want to show all numbers from 120 to 0
		const stepDuration = duration / totalSteps;

		function animate(currentTime: number) {
			const elapsed = currentTime - startTime;
			const currentStep = Math.floor(elapsed / stepDuration);

			if (currentStep <= totalSteps) {
				fps = 120 - currentStep;
				requestAnimationFrame(animate);
			}
		}

		requestAnimationFrame(animate);
	});
</script>

<div class="fps-counter" bind:this={fpsElement}>
	{fps}
</div>

{@render children()}

<style>
	.fps-counter {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-family: monospace;
		font-size: 12rem;
		font-weight: bold;
		color: #000;
		z-index: 1000;
		transition: opacity 0.1s ease;
	}
</style>
