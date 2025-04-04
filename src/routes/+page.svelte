<!-- Empty page to show only the FPS counter -->

<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import html2canvas from 'html2canvas';
	import GIF from 'gif.js';

	const fps = writable(120);
	const textClass = writable(
		'bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent'
	);
	let fpsElement: HTMLElement;
	let animationContainer: HTMLElement;
	let activeTab = $state('gradient');
	let backgroundClass = $state('bg-white');
	let customColorInput = $state('');
	let textStyle = $state(''); // Add this for inline styles
	let backgroundStyle = $state(''); // Add this for background inline styles
	let animationFrameId: number;
	let isRecording = $state(false);
	let isDownloading = $state(false);
	let recordedFrames: ImageData[] = [];
	let mediaRecorder: MediaRecorder | null = null;
	let recordedChunks: Blob[] = [];
	let recordingType: 'gif' | 'mp4' = 'gif';

	// Animation state
	let isPlaying = $state(true);
	let progress = $state(0);
	let startTime: number;
	let pausedTime = 0;
	let currentKeyframeIndex = $state(0);

	// Keyframe type and default keyframes
	type Keyframe = {
		value: number;
		holdTime: number; // Time to hold at this keyframe in ms
		transitionDuration: number; // Duration of transition to next keyframe
	};

	let keyframes = $state<Keyframe[]>([
		{ value: 120, holdTime: 200, transitionDuration: 500 }, // Start at max refresh rate with hold
		{ value: 60, holdTime: 200, transitionDuration: 200 }, // Significant slowdown with hold
		{ value: 30, holdTime: 200, transitionDuration: 1000 }, // Further slowdown with hold
		{ value: 60, holdTime: 200, transitionDuration: 500 }, // Bounce back up
		{ value: 1, holdTime: 0, transitionDuration: 200 } // Final settling
	]);

	// Animation configuration
	let easingFunction = $state('no animation'); // Changed from 'delayed' to 'no animation'

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

	const backgroundColors = [
		{ name: 'White', class: 'bg-white' },
		{ name: 'Red', class: 'bg-red-500' },
		{ name: 'Blue', class: 'bg-blue-500' },
		{ name: 'Green', class: 'bg-green-500' },
		{ name: 'Purple', class: 'bg-purple-500' },
		{ name: 'Yellow', class: 'bg-yellow-500' },
		{ name: 'Pink', class: 'bg-pink-500' },
		{ name: 'Orange', class: 'bg-orange-500' },
		{ name: 'Teal', class: 'bg-teal-500' },
		{ name: 'Indigo', class: 'bg-indigo-500' },
		{ name: 'Gray 100', class: 'bg-gray-100' },
		{ name: 'Gray 200', class: 'bg-gray-200' },
		{ name: 'Gray 300', class: 'bg-gray-300' },
		{ name: 'Gray 400', class: 'bg-gray-400' },
		{ name: 'Gray 500', class: 'bg-gray-500' },
		{ name: 'Black', class: 'bg-black' }
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
	let fromColor = colors[1]; // blue
	let toColor = colors[3]; // purple

	// Easing functions
	const easingFunctions: Record<string, (t: number) => number> = {
		'no animation': (t: number) => 0, // Stay at current value until time slot is complete
		linear: (t: number) => t,
		easeIn: (t: number) => t * t,
		easeOut: (t: number) => t * (2 - t),
		easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
		bounce: (t: number) => {
			const n1 = 7.5625;
			const d1 = 2.75;
			if (t < 1 / d1) return n1 * t * t;
			if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
			if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
			return n1 * (t -= 2.625 / d1) * t + 0.984375;
		},
		elastic: (t: number) => {
			const c4 = (2 * Math.PI) / 3;
			return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
		},
		cubic: (t: number) => t * t * t,
		sine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
		circ: (t: number) => 1 - Math.sqrt(1 - t * t),
		expo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
		easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
		easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
		easeInOutExpo: (t: number) => {
			if (t === 0) return 0;
			if (t === 1) return 1;
			if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
			return (2 - Math.pow(2, -20 * t + 10)) / 2;
		},
		easeInBack: (t: number) => {
			const c1 = 1.70158;
			return c1 * t * t * t - c1 * t * t;
		},
		easeOutBack: (t: number) => {
			const c1 = 1.70158;
			return 1 + c1 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
		},
		easeInOutBack: (t: number) => {
			const c2 = 2.5949095;
			if (t < 0.5) return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2;
			return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
		},
		easeInQuad: (t: number) => t * t,
		easeOutQuad: (t: number) => t * (2 - t),
		easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
		easeInQuart: (t: number) => t * t * t * t,
		easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
		easeInOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
		easeOutQuint: (t: number) => 1 - Math.pow(1 - t, 5),
		easeOutCirc: (t: number) => Math.sqrt(1 - Math.pow(t - 1, 2))
	};

	function getTotalDuration() {
		return keyframes.reduce((total, frame, index) => {
			const isLast = index === keyframes.length - 1;
			return total + frame.holdTime + (isLast ? 0 : frame.transitionDuration);
		}, 0);
	}

	function getCurrentKeyframeProgress(currentTime: number) {
		let elapsed = currentTime - startTime + pausedTime;
		let totalProgress = 0;
		let currentKeyframeStartTime = 0;

		// Find which keyframe we're in and calculate progress
		for (let i = 0; i < keyframes.length - 1; i++) {
			const frameDuration = keyframes[i].holdTime + keyframes[i].transitionDuration;
			if (elapsed < frameDuration) {
				currentKeyframeIndex = i;
				const frameProgress = Math.min(elapsed / frameDuration, 1);
				const holdProgress = Math.min(elapsed / keyframes[i].holdTime, 1);

				if (holdProgress < 1) {
					// We're in the hold phase
					return 0;
				} else {
					// We're in the transition phase
					if (easingFunction === 'no animation') {
						// Stay at current value until the full duration is over
						return 0;
					}
					return (elapsed - keyframes[i].holdTime) / keyframes[i].transitionDuration;
				}
			}
			elapsed -= frameDuration;
		}

		// We're at the last keyframe
		currentKeyframeIndex = keyframes.length - 1;
		return 1;
	}

	function getOverallProgress(currentTime: number) {
		let elapsed = currentTime - startTime + pausedTime;
		let totalDuration = getTotalDuration();
		return Math.min(elapsed / totalDuration, 1);
	}

	function animate(currentTime: number) {
		if (!startTime) startTime = currentTime;

		const frameProgress = getCurrentKeyframeProgress(currentTime);
		const currentFrame = keyframes[currentKeyframeIndex];
		const nextFrame = keyframes[currentKeyframeIndex + 1];

		if (nextFrame) {
			// Create a smooth transition between keyframes only if easing is selected
			const easedProgress = easingFunctions[easingFunction](frameProgress);

			// Calculate the current value with smooth easing
			const currentValue =
				currentFrame.value + (nextFrame.value - currentFrame.value) * easedProgress;

			fps.set(Math.round(currentValue));
			progress = getOverallProgress(currentTime);

			// Capture frame if recording
			if (isRecording && fpsElement) {
				html2canvas(fpsElement, {
					backgroundColor: '#ffffff',
					scale: 2, // Higher quality
					useCORS: true,
					allowTaint: true,
					width: fpsElement.offsetWidth,
					height: fpsElement.offsetHeight,
					onclone: (clonedDoc) => {
						// Ensure the cloned element has the same styles
						const clonedElement = clonedDoc.querySelector('.fps-counter') as HTMLElement;
						if (clonedElement) {
							// Copy all computed styles from the original element
							const computedStyle = window.getComputedStyle(fpsElement);
							clonedElement.style.cssText = computedStyle.cssText;
							// Ensure text is visible
							clonedElement.style.color = 'transparent';
							clonedElement.style.webkitTextFillColor = 'transparent';
							clonedElement.style.backgroundClip = 'text';
							clonedElement.style.webkitBackgroundClip = 'text';
						}
					}
				}).then((canvas) => {
					const ctx = canvas.getContext('2d');
					if (ctx) {
						recordedFrames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
					}
				});
			}

			animationFrameId = requestAnimationFrame(animate);
		} else {
			// We're at the last frame
			fps.set(currentFrame.value);
			progress = 1;
			isPlaying = false;

			// Stop recording and create GIF/MP4
			if (isRecording) {
				isRecording = false;
				if (recordingType === 'gif') {
					createGif();
				} else {
					createMp4();
				}
			}
		}
	}

	async function createGif() {
		if (!fpsElement || recordedFrames.length === 0) return;

		const gif = new GIF({
			workers: 4,
			quality: 10,
			width: fpsElement.offsetWidth * 2,
			height: fpsElement.offsetHeight * 2,
			workerScript: '/gif.worker.js'
		});

		// Add frames to GIF
		recordedFrames.forEach((frame) => {
			const canvas = document.createElement('canvas');
			canvas.width = frame.width;
			canvas.height = frame.height;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.putImageData(frame, 0, 0);
				gif.addFrame(canvas, { delay: 1000 / 60 }); // 60fps
			}
		});

		gif.on('finished', (blob: Blob) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'animation.gif';
			a.click();
			URL.revokeObjectURL(url);
			isDownloading = false;
		});

		gif.render();
	}

	async function createMp4() {
		if (!fpsElement || recordedFrames.length === 0) return;

		const canvas = document.createElement('canvas');
		canvas.width = fpsElement.offsetWidth * 2;
		canvas.height = fpsElement.offsetHeight * 2;
		const ctx = canvas.getContext('2d');

		if (!ctx) return;

		const stream = canvas.captureStream(60); // 60fps
		mediaRecorder = new MediaRecorder(stream, {
			mimeType: 'video/webm;codecs=vp9',
			videoBitsPerSecond: 5000000 // 5Mbps
		});

		mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				recordedChunks.push(event.data);
			}
		};

		mediaRecorder.onstop = () => {
			const blob = new Blob(recordedChunks, { type: 'video/webm' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'animation.webm';
			a.click();
			URL.revokeObjectURL(url);
			recordedChunks = [];
			isDownloading = false;
		};

		mediaRecorder.start();
		let frameIndex = 0;

		const drawFrame = () => {
			if (frameIndex < recordedFrames.length) {
				ctx.putImageData(recordedFrames[frameIndex], 0, 0);
				frameIndex++;
				requestAnimationFrame(drawFrame);
			} else {
				mediaRecorder?.stop();
			}
		};

		drawFrame();
	}

	function togglePlayPause() {
		if (isPlaying) {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			pausedTime = performance.now() - startTime;
		} else {
			startTime = performance.now();
			animationFrameId = requestAnimationFrame(animate);
		}
		isPlaying = !isPlaying;
	}

	function resetAnimation() {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		progress = 0;
		startTime = 0;
		pausedTime = 0;
		fps.set(keyframes[0].value);
		isPlaying = false;
	}

	function startRecording(type: 'gif' | 'mp4') {
		// Reset and start recording
		resetAnimation();
		isRecording = true;
		isDownloading = true; // Set downloading state immediately
		recordingType = type;
		recordedFrames = [];
		startTime = performance.now();
		animationFrameId = requestAnimationFrame(animate);
	}

	function restartAnimation() {
		resetAnimation();
		isPlaying = true;
		startTime = performance.now();
		animationFrameId = requestAnimationFrame(animate);
	}

	function updateGradient() {
		textStyle = ''; // Clear any inline styles
		textClass.set(
			`${selectedDirection.class} from-${fromColor.bg.split('-')[1]}-500 to-${toColor.bg.split('-')[1]}-500 bg-clip-text text-transparent`
		);
	}

	function setSolidColor(color: (typeof colors)[0]) {
		textClass.set(color.class);
		textStyle = ''; // Clear any inline styles
		customColorInput = ''; // Clear custom input
	}

	function updateTextColor(value: string) {
		customColorInput = value;
		if (value.startsWith('#')) {
			// Handle hex color with inline style
			textStyle = `color: ${value}`;
			textClass.set(''); // Clear any Tailwind classes
		} else {
			// Handle Tailwind class
			textStyle = ''; // Clear inline style
			textClass.set(value);
		}
	}

	function addKeyframe() {
		const lastFrame = keyframes[keyframes.length - 1];
		keyframes = [
			...keyframes.slice(0, -1),
			{ value: lastFrame.value, holdTime: 0, transitionDuration: 500 },
			lastFrame
		];
	}

	function removeKeyframe(index: number) {
		if (keyframes.length <= 2) return; // Keep at least start and end frames
		keyframes = keyframes.filter((_, i) => i !== index);
	}

	function updateKeyframe(index: number, updates: Partial<Keyframe>) {
		keyframes = keyframes.map((frame, i) => (i === index ? { ...frame, ...updates } : frame));
	}

	function getKeyframePosition(index: number) {
		let position = 0;
		for (let i = 0; i < index; i++) {
			position += keyframes[i].holdTime + keyframes[i].transitionDuration;
		}
		return position / getTotalDuration();
	}

	function getPathString() {
		let path = `M 0,${100 - (keyframes[0].value / 120) * 100}`;

		// Add lines to each keyframe
		for (let i = 1; i < keyframes.length; i++) {
			path += ` L ${getKeyframePosition(i) * 100},${100 - (keyframes[i].value / 120) * 100}`;
		}

		// Add line to current position if we're between keyframes
		if (progress > 0 && progress < 1) {
			path += ` L ${progress * 100},${100 - ($fps / 120) * 100}`;
		}

		return path;
	}

	function updateBackgroundColor(value: string) {
		if (value.startsWith('#')) {
			// Handle hex color with inline style
			backgroundStyle = `background-color: ${value}`;
			backgroundClass = ''; // Clear any Tailwind classes
		} else {
			// Handle Tailwind class
			backgroundStyle = ''; // Clear inline style
			backgroundClass = value;
		}
	}

	let selectedFont = $state('Google Sans');

	const googleFonts = [
		'Google Sans',
		'Roboto',
		'Open Sans',
		'Lato',
		'Montserrat',
		'Poppins',
		'Source Sans Pro',
		'Ubuntu',
		'Raleway',
		'Nunito',
		'Inter',
		'Playfair Display',
		'Merriweather',
		'Noto Sans',
		'Work Sans',
		'Quicksand',
		'Rubik',
		'Mulish',
		'DM Sans',
		'Outfit',
		'Plus Jakarta Sans',
		'Manrope',
		'Figtree',
		'Space Grotesk',
		'Lexend'
	];

	function updateFont(font: string) {
		selectedFont = font;
		// Update the font-family in the style
		document
			.querySelector('.fps-counter')
			?.setAttribute('style', `font-family: '${font}', sans-serif`);
	}

	// Initialize gradient on mount
	onMount(() => {
		updateGradient();
		restartAnimation();
		updateFont(selectedFont);
		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;500;700&family=Lato:wght@400;500;700&family=Montserrat:wght@400;500;700&family=Poppins:wght@400;500;700&family=Source+Sans+Pro:wght@400;500;700&family=Ubuntu:wght@400;500;700&family=Raleway:wght@400;500;700&family=Nunito:wght@400;500;700&family=Inter:wght@400;500;700&family=Playfair+Display:wght@400;500;700&family=Merriweather:wght@400;500;700&family=Noto+Sans:wght@400;500;700&family=Work+Sans:wght@400;500;700&family=Quicksand:wght@400;500;700&family=Rubik:wght@400;500;700&family=Mulish:wght@400;500;700&family=DM+Sans:wght@400;500;700&family=Outfit:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;700&family=Manrope:wght@400;500;700&family=Figtree:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Lexend:wght@400;500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="flex h-screen overflow-hidden">
	<div
		class="flex flex-1 items-center justify-center {backgroundClass}"
		style={backgroundStyle}
		bind:this={animationContainer}
	>
		<div class="fps-counter {$textClass}" style={textStyle} bind:this={fpsElement}>
			{$fps}
		</div>
	</div>

	<div class="w-1/4 overflow-y-auto border-l border-gray-200 bg-white">
		<div class="p-4">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-sm font-semibold text-gray-700">Animation</h2>
				<div class="flex gap-2">
					<button
						class="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
						on:click={restartAnimation}
					>
						<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						Play
					</button>
				</div>
			</div>

			<!-- Animation Controls -->
			<div class="space-y-4">
				<!-- Progress Bar -->
				<div class="relative h-1.5 rounded-full bg-gray-200">
					<!-- Keyframe Markers and Labels -->
					{#each keyframes as keyframe, i}
						<div class="absolute" style="left: {getKeyframePosition(i) * 100}%">
							<!-- FPS Value Label -->
							<div class="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-gray-500">
								{keyframe.value}
							</div>
							<!-- Marker Line -->
							<div class="h-full w-0.5 bg-gray-400" />
						</div>
					{/each}
					<!-- Progress Fill -->
					<div
						class="absolute h-full rounded-full bg-blue-500 transition-all duration-100"
						style="width: {progress * 100}%"
					/>
				</div>

				<!-- Animation Parameters -->
				<div class="space-y-3">
					<div>
						<label class="mb-1 block text-xs font-medium text-gray-700"
							>Total Duration: {getTotalDuration()}ms</label
						>
					</div>

					<div>
						<label class="mb-1 block text-xs font-medium text-gray-700">Keyframes</label>
						<div class="space-y-2">
							<div class="flex items-center gap-2 text-xs text-gray-500">
								<div class="w-16">Value</div>
								<div class="w-16">Hold</div>
								<div class="w-16">Transition</div>
								<div class="w-8"></div>
							</div>
							{#each keyframes as keyframe, i}
								<div class="flex items-center gap-2">
									<input
										type="number"
										min="0"
										max="120"
										bind:value={keyframe.value}
										class="w-16 rounded border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									/>
									<input
										type="number"
										min="0"
										max="1000"
										step="100"
										bind:value={keyframe.holdTime}
										class="w-16 rounded border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									/>
									<input
										type="number"
										min="100"
										max="2000"
										step="100"
										bind:value={keyframe.transitionDuration}
										class="w-16 rounded border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									/>
									<button
										class="rounded bg-red-500 p-1 text-white hover:bg-red-600 focus:outline-none focus:ring-1 focus:ring-red-500"
										on:click={() => removeKeyframe(i)}
										disabled={keyframes.length <= 2}
									>
										<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								</div>
							{/each}
							<button
								class="mt-2 flex w-full items-center justify-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
								on:click={addKeyframe}
							>
								<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
								Add Keyframe
							</button>
						</div>
					</div>

					<div>
						<label class="mb-1 block text-xs font-medium text-gray-700">Animation</label>
						<select
							bind:value={easingFunction}
							class="w-full rounded border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							<option value="no animation">No Animation</option>
							{#each Object.keys(easingFunctions).filter((key) => key !== 'no animation') as easing}
								<option value={easing}>{easing}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- Color Controls -->
			<div class="mt-8 border-t border-gray-200 pt-4">
				<h2 class="mb-4 text-sm font-semibold text-gray-700">Style</h2>
				<div class="space-y-3">
					<!-- Tabs -->
					<div class="border-b border-gray-200">
						<nav class="-mb-px flex space-x-4">
							<button
								class="border-b px-1 py-1 text-xs font-medium transition-colors {activeTab ===
								'gradient'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
								on:click={() => {
									activeTab = 'gradient';
								}}
							>
								Gradient
							</button>
							<button
								class="border-b px-1 py-1 text-xs font-medium transition-colors {activeTab ===
								'solid'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
								on:click={() => (activeTab = 'solid')}
							>
								Solid
							</button>
							<button
								class="border-b px-1 py-1 text-xs font-medium transition-colors {activeTab ===
								'custom'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
								on:click={() => (activeTab = 'custom')}
							>
								Custom
							</button>
							<button
								class="border-b px-1 py-1 text-xs font-medium transition-colors {activeTab ===
								'background'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
								on:click={() => (activeTab = 'background')}
							>
								Background
							</button>
							<button
								class="border-b px-1 py-1 text-xs font-medium transition-colors {activeTab ===
								'font'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
								on:click={() => (activeTab = 'font')}
							>
								Font
							</button>
						</nav>
					</div>

					{#if activeTab === 'solid'}
						<!-- Solid Color Selection -->
						<div class="grid grid-cols-8 gap-0.5">
							{#each colors as color}
								<button
									class="group relative aspect-square rounded border border-gray-200 p-[1px] shadow-sm hover:border-gray-300 hover:ring-1 hover:ring-blue-500 {$textClass ===
									color.class
										? 'ring-1 ring-blue-500'
										: ''}"
									on:click={() => setSolidColor(color)}
								>
									<div class="h-full w-full rounded {color.bg}"></div>
								</button>
							{/each}
						</div>
					{:else if activeTab === 'custom'}
						<!-- Custom Input -->
						<div class="space-y-2">
							<label class="block text-xs font-medium text-gray-700">Custom Color</label>
							<input
								type="text"
								bind:value={customColorInput}
								on:input={(e) => updateTextColor(e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="Enter hex color (#FF0000) or Tailwind class..."
							/>
							<p class="text-xs text-gray-500">
								Enter a hex color (e.g. #FF0000) or Tailwind class (e.g. text-blue-500)
							</p>
						</div>
					{:else if activeTab === 'background'}
						<!-- Background Color Selection -->
						<div class="space-y-3">
							<div>
								<h3 class="mb-0.5 text-xs font-medium text-gray-700">Preset Colors</h3>
								<div class="grid grid-cols-8 gap-0.5">
									{#each backgroundColors as color}
										<button
											class="group relative aspect-square rounded border border-gray-200 p-[1px] shadow-sm hover:border-gray-300 hover:ring-1 hover:ring-blue-500 {backgroundClass ===
											color.class
												? 'ring-1 ring-blue-500'
												: ''}"
											on:click={() => {
												// Clear any inline styles and custom input first
												backgroundStyle = '';
												const input = document.querySelector(
													'input[placeholder*="hex color"]'
												) as HTMLInputElement;
												if (input) input.value = '';
												// Then set the new color
												backgroundClass = color.class;
											}}
										>
											<div class="h-full w-full rounded {color.class}"></div>
										</button>
									{/each}
								</div>
							</div>

							<div>
								<h3 class="mb-0.5 text-xs font-medium text-gray-700">Custom Background</h3>
								<input
									type="text"
									value={backgroundClass}
									on:input={(e) => updateBackgroundColor(e.currentTarget.value)}
									class="w-full rounded border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									placeholder="Enter hex color (#FF0000) or Tailwind class..."
								/>
								<p class="text-xs text-gray-500">
									Enter a hex color (e.g. #FF0000) or Tailwind class (e.g. bg-blue-500)
								</p>
							</div>
						</div>
					{:else if activeTab === 'font'}
						<!-- Font Selection -->
						<div class="space-y-3">
							<div>
								<h3 class="mb-0.5 text-xs font-medium text-gray-700">Google Fonts</h3>
								<select
									bind:value={selectedFont}
									on:change={(e) => updateFont(e.currentTarget.value)}
									class="w-full rounded border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								>
									{#each googleFonts as font}
										<option value={font}>{font}</option>
									{/each}
								</select>
							</div>
						</div>
					{:else}
						<!-- Gradient Controls -->
						<div class="space-y-1.5">
							<div>
								<h3 class="mb-0.5 text-xs font-medium text-gray-700">From</h3>
								<div class="grid grid-cols-8 gap-0.5">
									{#each colors as color}
										<button
											class="group relative aspect-square rounded border border-gray-200 p-[1px] shadow-sm hover:border-gray-300 hover:ring-1 hover:ring-blue-500 {fromColor ===
											color
												? 'ring-1 ring-blue-500'
												: ''}"
											on:click={() => {
												fromColor = color;
												updateGradient();
											}}
										>
											<div class="h-full w-full rounded {color.bg}"></div>
										</button>
									{/each}
								</div>
							</div>

							<div>
								<h3 class="mb-0.5 text-xs font-medium text-gray-700">To</h3>
								<div class="grid grid-cols-8 gap-0.5">
									{#each colors as color}
										<button
											class="group relative aspect-square rounded border border-gray-200 p-[1px] shadow-sm hover:border-gray-300 hover:ring-1 hover:ring-blue-500 {toColor ===
											color
												? 'ring-1 ring-blue-500'
												: ''}"
											on:click={() => {
												toColor = color;
												updateGradient();
											}}
										>
											<div class="h-full w-full rounded {color.bg}"></div>
										</button>
									{/each}
								</div>
							</div>

							<div>
								<h3 class="mb-0.5 text-xs font-medium text-gray-700">Direction</h3>
								<div class="grid grid-cols-4 gap-0.5">
									{#each gradientDirections as direction}
										<button
											class="group relative aspect-square rounded border border-gray-200 p-0.5 shadow-sm hover:border-gray-300 hover:ring-1 hover:ring-blue-500 {selectedDirection ===
											direction
												? 'ring-1 ring-blue-500'
												: ''}"
											on:click={() => {
												selectedDirection = direction;
												updateGradient();
											}}
										>
											<div
												class="flex h-full w-full items-center justify-center rounded bg-gradient-to-br from-gray-100 to-gray-200"
											>
												{#if direction.class === 'bg-gradient-to-r'}
													<svg
														class="h-4 w-4 text-blue-500"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M13 7l5 5m0 0l-5 5m5-5H6"
														/>
													</svg>
												{:else if direction.class === 'bg-gradient-to-l'}
													<svg
														class="h-4 w-4 rotate-180 text-blue-500"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M13 7l5 5m0 0l-5 5m5-5H6"
														/>
													</svg>
												{:else if direction.class === 'bg-gradient-to-b'}
													<svg
														class="h-4 w-4 rotate-90 text-blue-500"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M13 7l5 5m0 0l-5 5m5-5H6"
														/>
													</svg>
												{:else if direction.class === 'bg-gradient-to-t'}
													<svg
														class="h-4 w-4 -rotate-90 text-blue-500"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M13 7l5 5m0 0l-5 5m5-5H6"
														/>
													</svg>
												{:else if direction.class === 'bg-gradient-to-tr'}
													<svg
														class="h-4 w-4 rotate-45 text-blue-500"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M13 7l5 5m0 0l-5 5m5-5H6"
														/>
													</svg>
												{:else if direction.class === 'bg-gradient-to-tl'}
													<svg
														class="h-4 w-4 -rotate-45 text-blue-500"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M13 7l5 5m0 0l-5 5m5-5H6"
														/>
													</svg>
												{:else if direction.class === 'bg-gradient-to-br'}
													<svg
														class="rotate-135 h-4 w-4 text-blue-500"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M13 7l5 5m0 0l-5 5m5-5H6"
														/>
													</svg>
												{:else if direction.class === 'bg-gradient-to-bl'}
													<svg
														class="-rotate-135 h-4 w-4 text-blue-500"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M13 7l5 5m0 0l-5 5m5-5H6"
														/>
													</svg>
												{/if}
											</div>
										</button>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.fps-counter {
		font-family: 'Google Sans', sans-serif;
		font-size: 12rem;
		font-weight: 700;
		transition: opacity 0.1s ease;
	}
</style>
