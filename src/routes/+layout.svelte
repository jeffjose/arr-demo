<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let { children } = $props();

	const fps = writable(120);
	const textClass = writable(
		'bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent'
	);
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

<div class="flex h-screen">
	<div class="flex flex-1 items-center justify-center">
		<div class="fps-counter {$textClass}" bind:this={fpsElement}>
			{$fps}
		</div>
	</div>

	<div class="w-96 border-l border-gray-200 p-6">
		<h2 class="mb-4 text-xl font-semibold">Animation Controls</h2>
		<div class="space-y-4">
			<div>
				<label for="text" class="mb-1 block text-sm font-medium text-gray-700">
					Text Style Classes
				</label>
				<input
					type="text"
					id="text"
					bind:value={$textClass}
					class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Enter Tailwind classes (e.g. text-red-500 or bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent)"
				/>
			</div>
		</div>
	</div>
</div>

{@render children()}

<style>
	.fps-counter {
		font-family: 'Google Sans', sans-serif;
		font-size: 12rem;
		font-weight: 700;
		transition: opacity 0.1s ease;
	}
</style>
