<script lang="ts">
	import { socket } from '../background.js';

	import { fade } from 'svelte/transition';
	import axios from 'axios';


	import Message from './Message.svelte';
	let showMessage = false;
	let secondButton = false;
	let messageTitle = ''
  	let messageText = '';
	let messageButton1Text = '';
	let messageButton2Text = ''

	let messageOnDecision = (decisionIndex: number) => {
		socket.emit("decisionTaken", decisionIndex)
	}

	let onClose = () => {
		showMessage = false;
	}

	socket.on('showMessage', (messageData) => {
		showMessage = true;

		messageTitle = messageData.title;
		messageText = messageData.text;
		messageButton1Text = messageData.button1text;
		messageButton2Text = messageData.button2text;
		secondButton = messageData.secondButton;
	});

	/*let cpu_load = '0';
	let memory_usage = '0';
	let temp = '0';

	let cpu_color = 'gray';
	let memory_color = 'gray';
	let temp_color = 'gray';
	let connected_color = 'gray';*/

	let showNavbar = false;

	/*function changeHealth(health: any) {
		if (!health || !health.load) return;

		cpu_load = health.load.currentLoad.toFixed(1);
		memory_usage = ((health.memory.active / health.memory.total) * 100).toFixed(1);
		temp = health.temperature.main?.toFixed(1) || '0';

		if (parseInt(cpu_load) < 45) {
			cpu_color = 'green';
		} else if (parseInt(cpu_load) < 75) {
			cpu_color = 'orange';
		} else {
			cpu_color = 'red';
		}

		if (parseInt(memory_usage) < 50) {
			memory_color = 'green';
		} else if (parseInt(memory_usage) < 85) {
			memory_color = 'orange';
		} else {
			memory_color = 'red';
		}

		if (parseInt(temp) < 55) {
			temp_color = 'green';
		} else if (parseInt(temp) < 80) {
			temp_color = 'orange';
		} else {
			temp_color = 'red';
		}

		connected_color = 'green';
	}

	socket.on('disconnect', () => {
		cpu_load = 'unknown';
		memory_usage = 'unknown';
		temp = 'unknown ';

		cpu_color = 'black';
		memory_color = 'black';
		temp_color = 'black';
		connected_color = 'black';
	});

	socket.on('health', (newHealth) => {
		changeHealth(newHealth.main);
	});*/

	let latestHref = window.location.href;

	let location = new URL(window.location.href);
	let no_navbar = location.searchParams.get('no_navbar');
	let pLocation = location.pathname.substring(1);

	setInterval(() => {
		if (latestHref !== window.location.href) {
			actualNavbar = window.innerHeight < window.innerWidth;

			latestHref = window.location.href;
			location = new URL(window.location.href);
			no_navbar = location.searchParams.get('no_navbar');
			pLocation = location.pathname.substring(1);
		}
	}, 100);

	/*if (no_navbar !== 'true' && pLocation !== 'login') {
		axios
			.get('/api/health?minimal=true&multiple=false')
			.then((data) => {
				showNavbar = true;

				changeHealth(data.data.main);
			})
			.catch(() => {
				cpu_load = 'unknown';
				memory_usage = 'unknown';
				temp = 'unknown ';

				cpu_color = 'black';
				memory_color = 'black';
				temp_color = 'black';
				connected_color = 'red';
			});
	}*/

	if (no_navbar !== 'true' && pLocation !== 'login') {
		axios
			.get('/api/health?login=true')
			.then((data) => {
				showNavbar = data.data.connected;
			})
	}

	let el = document.querySelector('#slot');
	let scrollpos_str = localStorage.getItem(`scrollpos-${window.location.href.split('://')[1]}`);
	let scrollpos = scrollpos_str ? parseInt(scrollpos_str) : 0;
	el?.scrollTo(0, scrollpos);

	window.onbeforeunload = function () {
		if (el)
			localStorage.setItem(
				`scrollpos-${window.location.href.split('://')[1]}`,
				el.scrollTop.toString()
			);
	};

	let actualNavbar = window.innerHeight < window.innerWidth;

	let VRS = 'V?.?.?';
	let latestVRS = 'V?.?.?';

	axios
		.get('/api/version')
		.then((data) => {
			VRS = data.data;
		})
		.catch(() => {});

	axios
		.get('/api/latest_version')
		.then((data) => {
			latestVRS = data.data;
		})
		.catch(() => {});

	function hideSidebar() {
		actualNavbar = !actualNavbar;
	}

	let statusArray = ['Start workers', 'Checking proxies', 'Stop workers'];
	let workersStatus = 0;
	$: workersTitle = statusArray[workersStatus];

	axios
		.get('/api/workingStatus')
		.then((data) => {
			workersStatus = data.data;
		})
		.catch(() => {});

	socket.on('workerStatusChanged', (newStatus) => {
		workersStatus = newStatus;
	});

	let bounce = Date.now() - 3000;

	function start_workers() {
		if (bounce + 1000 < Date.now()) {
			bounce = Date.now();

			workersStatus += 1;
			if (workersStatus >= 2) workersStatus = 0;

			axios.post('/api/workingStatus', { status: workersStatus });
		}
	}

	const originalConsoleLog = console.log;
	const originalConsoleError = console.error;
	const originalConsoleWarn = console.warn;

	console.log = (...args) => {
		socket.emit('log_message', { type: 'info', message: args.join(' ') });
		originalConsoleLog(...args);
	};

	console.error = (...args) => {
		socket.emit('log_message', { type: 'error', message: args.join(' ') });
		originalConsoleError(...args);
	};

	console.warn = (...args) => {
		socket.emit('log_message', { type: 'warn', message: args.join(' ') });
		originalConsoleWarn(...args);
	};

	window.onerror = function (message, source, lineno, colno, error) {
		let msg = `${message}, ${source}, ${lineno}, ${colno}`;
		socket.emit('log_message', { type: 'error', message: msg });

		return false;
	};

	window.addEventListener('unhandledrejection', function (event) {
		socket.emit('log_message', { type: 'error', message: `Promise unhandled rejection: ${event.reason}` });
	});
</script>

<Message
  text={messageText}
  button1Text={messageButton1Text}
  button2Text={messageButton2Text}
  title={messageTitle}
  showMessage={showMessage}
  secondButton={secondButton}
  onDecision={messageOnDecision}
  onClose={onClose}
/>

<div id="main_div">
	{#if showNavbar}
		{#if actualNavbar}
			<div id="sidebar" in:fade>
				<div id="small_stats">
					<div id="title">
						<h4>YOUTUBE WATCH BOT</h4>
					</div>
					<!--<div id="actual_stats">
						<h2 id="status_title">Status</h2>

						<div class="stats_show">
							<div class="stats_green" style="background-color: {connected_color}" />
							<h2 class="status_subtitle">
								{(connected_color == 'green' && 'Online') || 'Offline'}
							</h2>
						</div>

						<div class="stats_show">
							<div class="stats_green" style="background-color: {cpu_color}" />
							<h2 class="status_subtitle">CPU load: {cpu_load}%</h2>
						</div>

						<div class="stats_show">
							<div class="stats_green" style="background-color: {memory_color}" />
							<h2 class="status_subtitle">Memory usage: {memory_usage}%</h2>
						</div>

						<div class="stats_show" style="margin-bottom: 5%;">
							<div class="stats_green" style="background-color: {temp_color}" />
							<h2 class="status_subtitle">Temp: {temp}C</h2>
						</div>
					</div>-->
				</div>
				<div id="sidebar_buttons">
					<a class="sidebar_button" href="/" class:green_sidebar={pLocation == ''}>
						<img src="/svgs/dashboard.svg" alt="button svg" class="sidebar_image" />
						<span class="sidebar_btn_title">Dashboard</span>
					</a>

					<a
						class="sidebar_button"
						href="/extensions"
						class:green_sidebar={pLocation == 'extensions'}
					>
						<img src="/svgs/extensions.svg" alt="button svg" class="sidebar_image" />
						<span class="sidebar_btn_title">Extensions</span>
					</a>

					<a class="sidebar_button" href="/proxies" class:green_sidebar={pLocation == 'proxies'}>
						<img src="/svgs/proxies.svg" alt="button svg" class="sidebar_image" />
						<span class="sidebar_btn_title">Proxies</span>
					</a>

					<a class="sidebar_button" href="/videos" class:green_sidebar={pLocation == 'videos'}>
						<img src="/svgs/videos.svg" alt="button svg" class="sidebar_image" />
						<span class="sidebar_btn_title">Videos</span>
					</a>

					<!--<a class="sidebar_button" href="/console" class:green_sidebar={pLocation == 'console'}>
						<img src="/svgs/console.svg" alt="button svg" class="sidebar_image" />
						<span class="sidebar_btn_title">Console</span>
					</a>-->

					<a class="sidebar_button" href="/settings" class:green_sidebar={pLocation == 'settings'}>
						<img src="/svgs/settings.svg" alt="button svg" class="sidebar_image" />
						<span class="sidebar_btn_title">Settings</span>
					</a>

					<a
						class="sidebar_button red_sidebar"
						href="/change_password"
						class:green_sidebar={pLocation == 'change_password'}
					>
						<img src="/svgs/password.svg" alt="button svg" class="sidebar_image" />
						<span class="sidebar_btn_title">Change password</span>
					</a>

					<a class="sidebar_button blue_sidebar" href="/donate">
						<img src="/svgs/donate.svg" alt="button svg" class="sidebar_image" />
						<span class="sidebar_btn_title">Donate</span>
					</a>

					<a class="sidebar_button blue_sidebar" href="https://github.com/JijaProGamer/Youtube-View-Bot">
						<img src="/svgs/github.svg" alt="button svg" class="sidebar_image" />
						<span class="sidebar_btn_title">Github page</span>
					</a>
				</div>
			</div>
		{/if}

		<div id="navbar-{actualNavbar}" class="navbar">
			<div id="navbar-buttons">
				<button id="close_sidebar" on:click={hideSidebar}> &lt</button>
				<button id="start_workers" class="worker_{workersStatus}" on:click={start_workers}>
					{workersTitle}
				</button>
				<p id="version_container" class={latestVRS == VRS ? 'latest_version' : 'old_version'}>
					version {VRS}
				</p>
			</div>

			<div id="slot" class="slot-color">
				<slot />
			</div>
		</div>
	{:else}
		<div id="slot">
			<slot />
		</div>
	{/if}
</div>

<style lang="scss">
	.latest_version {
		color: rgb(45, 223, 22);
	}

	.old_version {
		color: rgb(216, 20, 6);
	}

	#start_workers {
		color: rgb(240, 234, 227);

		height: 100%;
		max-height: 100%;
		min-height: 100%;

		border: 0;
		font-weight: 900;
		font-size: 1.75em;
	}

	.worker_0 {
		background-color: green;
		box-shadow: 0 0 6px 2px rgba(124, 212, 9, 0.856);
	}

	.worker_1 {
		background-color: rgb(223, 105, 9);
		box-shadow: 0 0 6px 2px rgba(167, 94, 10, 0.767);
	}

	.worker_2 {
		background-color: rgb(211, 9, 9);
		box-shadow: 0 0 6px 2px rgba(245, 42, 42, 0.815);
	}

	#version_container {
		display: flex;
		align-self: center;
		align-items: center;

		text-align: center;
		background-color: transparent;
		border: 0 transparent;

		margin-right: 3%;

		font-weight: bold;
		font-size: 1.75em;
	}

	@media only screen and (orientation: portrait) {
		#start_workers {
			font-size: 1em;
		}

		#version_container {
			font-size: 1.25em;
			margin-right: 1%;
		}
	}

	.navbar {
		height: 6vh;
		min-height: 6vh;
		max-height: 6vh;

		background-color: #272c30;
	}

	#navbar-buttons {
		height: 100%;
		max-height: 100%;
		min-height: 100%;

		display: flex;
		justify-content: space-between;
	}

	.sidebar_button {
		display: flex;

		margin-top: 1%;

		width: 100%;
		max-width: 100%;
		min-width: 100%;

		height: 5%;
		max-height: 5%;
		min-height: 5%;
	}

	.green_sidebar {
		background-color: rgb(38, 122, 30);
	}

	.blue_sidebar {
		background-color: #185ca0;
	}

	.red_sidebar {
		background-color: #a01010;
	}

	.sidebar_button:hover {
		background-image: linear-gradient(rgb(0 0 0/40%) 0 0);
	}

	.sidebar_btn_title {
		margin-left: 20%;
		font-weight: bold;
		text-align: center;
	}

	.sidebar_image {
		aspect-ratio: 1;
		max-height: 5vh;
	}

	#close_sidebar {
		margin-left: 1.5%;
		aspect-ratio: 1;

		height: 100%;
		max-height: 100%;
		min-height: 100%;

		background-color: transparent;
		border: 0 transparent;

		font-weight: bold;
		font-size: 150%;
	}

	#title {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;

		font-size: 1em;
		color: rgb(240, 233, 233);
		background-color: rgb(8, 156, 20);
		font-weight: bold;

		max-height: 6vh;
		min-height: 6vh;
		height: 6vh;

		width: 100%;
		min-width: 100%;
	}

	#actual_stats {
		border: 0;
		box-shadow: 0 0 12px 4px rgba(0, 0, 0, 0.4);
		width: 100%;
		min-width: 100%;
	}

	#status_title {
		text-align: center;
		font-size: 1.1em;
		color: rgb(240, 233, 233);
		font-weight: bold;
	}

	.stats_green {
		margin-left: 3%;
		margin-right: 5%;

		min-width: 1em;
		width: 1em;
		max-width: 1em;

		min-height: 1em;
		height: 1em;
		max-height: 1em;

		background-color: rgb(8, 156, 20);
		border-radius: 25px;
		border: 0;
	}

	.stats_show {
		display: flex;
		justify-content: left;
		justify-items: center;
	}

	.status_subtitle {
		margin-left: 1%;
		text-align: left;
		font-size: 100%;
		color: rgb(212, 201, 201);
	}

	#small_stats {
		display: flex;

		flex-direction: column;
		justify-content: center;
		align-items: center;

		min-height: 13%;
		width: 100%;
		min-width: 100%;
		margin-bottom: 5%;
	}
	#sidebar {
		margin-left: 2vw;
		background-color: #272c30;

		width: 180px;
		max-width: 16%;
		min-width: 180px;

		max-height: 100vh;
		height: 100vh;
		min-height: 100vh;
	}

	#navbar-false {
		max-width: 94vw;
		width: 94vw;
		min-width: 94vw;
		margin-left: 3vw;
	}

	#navbar-true {
		max-width: calc(100vw - 4vw - 200px);
		width: calc(100vw - 4vw - 200px);
		min-width: calc(100vw - 4vw - 200px);
	}

	#main_div {
		display: flex;
	}

	.slot-color {
		background-color: #353c42;

		height: 94vh;
		max-height: 94vh;
		min-height: 94vh;

		width: 100%;
		max-width: 100%;
		min-width: 100%;
	}

	@media only screen and (orientation: portrait) {
		#navbar-true {
			min-width: 100%;
			max-width: 100%;
			width: 100%;
			margin-left: 0;
		}

		#navbar-false {
			min-width: 100%;
			max-width: 100%;
			width: 100%;
			margin-left: 0;
		}

		#sidebar {
			margin-left: 0;
		}
	}

	#slot {
		overflow-y: auto;
		overflow-x: hidden;
	}

	#slot,
	#navbar,
	#sidebar {
		flex: 1;
	}
</style>
