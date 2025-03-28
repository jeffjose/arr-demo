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
	let activeTab = 'solid';

	const colors = [
		{ name: 'Red', class: 'text-red-500', bg: 'bg-red-500' },
		{ name: 'Blue', class: 'text-blue-500', bg: 'bg-blue-500' },
		{ name: 'Green', class: 'text-green-500', bg: 'bg-green-500' },
		{ name: 'Purple', class: 'text-purple-500', bg: 'bg-purple-500' },
		{ name: 'Yellow', class: 'text-yellow-500', bg: 'bg-yellow-500' },
		{ name: 'Pink', class: 'text-pink-500', bg: 'bg-pink-500' },
		{ name: 'Orange', class: 'text-orange-500', bg: 'bg-orange-500' },
		{ name: 'Teal', class: 'text-teal-500', bg: 'bg-teal-500' },
		{ name: 'Indigo', class: 'text-indigo-500', bg: 'bg-indigo-500' }
	];

	const gradientDirections = [
		{ name: 'L→R', class: 'bg-gradient-to-r' },
		{ name: 'R→L', class: 'bg-gradient-to-l' },
		{ name: 'T→B', class: 'bg-gradient-to-b' },
		{ name: 'B→T', class: 'bg-gradient-to-t' },
		{ name: 'TR', class: 'bg-gradient-to-tr' },
		{ name: 'TL', class: 'bg-gradient-to-tl' },
		{ name: 'BR', class: 'bg-gradient-to-br' },
		{ name: 'BL', class: 'bg-gradient-to-bl' }
	];

	let selectedDirection = gradientDirections[0];
	let fromColor = colors[0];
	let toColor = colors[1];

	function updateGradient() {
		textClass.set(
			`${selectedDirection.class} from-${fromColor.bg.split('-')[1]}-500 to-${toColor.bg.split('-')[1]}-500 bg-clip-text text-transparent`
		);
	}

	function setSolidColor(color: (typeof colors)[0]) {
		textClass.set(color.class);
	}

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

	<div class="w-64 border-l border-gray-200 p-4">
		<h2 class="mb-3 text-sm font-semibold text-gray-700">Style</h2>
		<div class="space-y-3">
			<!-- Tabs -->
			<div class="border-b border-gray-200">
				<nav class="-mb-px flex space-x-4">
					<button
						class="border-b px-1 py-1 text-xs font-medium transition-colors {activeTab === 'solid'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						on:click={() => (activeTab = 'solid')}
					>
						Solid
					</button>
					<button
						class="border-b px-1 py-1 text-xs font-medium transition-colors {activeTab ===
						'gradient'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						on:click={() => (activeTab = 'gradient')}
					>
						Gradient
					</button>
				</nav>
			</div>

			{#if activeTab === 'solid'}
				<!-- Solid Color Selection -->
				<div class="grid grid-cols-3 gap-1">
					{#each colors as color}
						<button
							class="group relative aspect-square rounded border border-gray-200 p-0.5 shadow-sm hover:border-gray-300"
							on:click={() => setSolidColor(color)}
						>
							<div class="h-full w-full rounded {color.bg}"></div>
							<span
								class="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
							>
								{color.name}
							</span>
						</button>
					{/each}
				</div>
			{:else}
				<!-- Gradient Controls -->
				<div class="space-y-2">
					<div>
						<h3 class="mb-1 text-xs font-medium text-gray-700">Direction</h3>
						<div class="grid grid-cols-4 gap-1">
							{#each gradientDirections as direction}
								<button
									class="rounded border border-gray-200 px-1 py-0.5 text-[10px] font-medium shadow-sm hover:bg-gray-50 {selectedDirection ===
									direction
										? 'border-blue-500 bg-blue-50 text-blue-700'
										: ''}"
									on:click={() => {
										selectedDirection = direction;
										updateGradient();
									}}
								>
									{direction.name}
								</button>
							{/each}
						</div>
					</div>

					<div>
						<h3 class="mb-1 text-xs font-medium text-gray-700">From</h3>
						<div class="grid grid-cols-3 gap-1">
							{#each colors as color}
								<button
									class="group relative aspect-square rounded border border-gray-200 p-0.5 shadow-sm hover:border-gray-300 {fromColor ===
									color
										? 'ring-1 ring-blue-500'
										: ''}"
									on:click={() => {
										fromColor = color;
										updateGradient();
									}}
								>
									<div class="h-full w-full rounded {color.bg}"></div>
									<span
										class="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
									>
										{color.name}
									</span>
								</button>
							{/each}
						</div>
					</div>

					<div>
						<h3 class="mb-1 text-xs font-medium text-gray-700">To</h3>
						<div class="grid grid-cols-3 gap-1">
							{#each colors as color}
								<button
									class="group relative aspect-square rounded border border-gray-200 p-0.5 shadow-sm hover:border-gray-300 {toColor ===
									color
										? 'ring-1 ring-blue-500'
										: ''}"
									on:click={() => {
										toColor = color;
										updateGradient();
									}}
								>
									<div class="h-full w-full rounded {color.bg}"></div>
									<span
										class="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
									>
										{color.name}
									</span>
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Custom Input (Collapsible) -->
			<div class="border-t border-gray-200 pt-2">
				<details>
					<summary class="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900">
						Custom
					</summary>
					<div class="mt-1">
						<input
							type="text"
							bind:value={$textClass}
							class="w-full rounded border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							placeholder="Custom classes..."
						/>
					</div>
				</details>
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
