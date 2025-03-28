<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let { children } = $props();

	const fps = writable(120);
	let fpsElement: HTMLElement;

	onMount(() => {
		console.log('Animation started');
		const duration = 2000; // 2 seconds
		const startTime = performance.now();
		const totalSteps = 120; // We want to show all numbers from 120 to 0
		const stepDuration = duration / totalSteps;
		console.log('Step duration:', stepDuration, 'ms');

		function animate(currentTime: number) {
			const elapsed = currentTime - startTime;
			const currentStep = Math.floor(elapsed / stepDuration);

			if (currentStep <= totalSteps) {
				fps.set(120 - currentStep);
				console.log(
					'Current FPS:',
					120 - currentStep,
					'Step:',
					currentStep,
					'Elapsed:',
					elapsed.toFixed(2),
					'ms'
				);
				requestAnimationFrame(animate);
			} else {
				console.log('Animation completed');
			}
		}

		requestAnimationFrame(animate);
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div
	class="fps-counter bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
	bind:this={fpsElement}
>
	{$fps}
</div>

{@render children()}

<style>
	.fps-counter {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-family: 'Google Sans', sans-serif;
		font-size: 12rem;
		font-weight: 700;
		z-index: 1000;
		transition: opacity 0.1s ease;
	}
</style>
