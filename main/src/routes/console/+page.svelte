<script lang="ts">
	import GoodDisplay from '../../proxy_containers/good.svelte';
	import BadDisplay from '../../proxy_containers/bad.svelte';
	import AllDisplay from '../../proxy_containers/all.svelte';

	import axios from 'axios';
	import { opts, dataChanged, newData, socket } from '../../background.js';

	let data = opts;
	dataChanged((newData: any) => (data = newData));
	$: newData(data);

	let good_proxies: string[] = [];
	let bad_proxies: string[] = [];
	let untested_proxies: string[] = [];

	let proxies: string[] = [];
	let proxies_raw = '';

	axios
		.get('/api/proxies')
		.then((data) => {
			proxies = data.data;
			proxies_raw = proxies.join('\n');
		})
		.catch(() => {});

	axios
		.get('/api/proxiesStats')
		.then((data) => {
			good_proxies = data.data.good;
			untested_proxies = data.data.untested;
			bad_proxies = data.data.bad;
		})
		.catch(() => {});

	function formatProxies(e: any) {
		let newProxies = e.target.value;

		proxies = newProxies.split('\n');

		publishProxies(proxies);
	}

	function publishProxies(newProxies: string[]) {
		socket.emit('proxies', newProxies);
	}

	socket.on('proxiesChanged', (newProxies) => {
		proxies = newProxies;
		proxies_raw = proxies.join('\n');
	});

	socket.on('newProxiesStats', (newProxies) => {
		good_proxies = newProxies.good;
		untested_proxies = newProxies.untested;
		bad_proxies = newProxies.bad;
	});

	let displayingProxyType = 'all';
	$: colorFromDisplay =
		(displayingProxyType == 'all' && 'yellow') ||
		(displayingProxyType == 'bad' && 'red') ||
		'green';
</script>

<div id="local_container">
	<div id="form_container">
		<div class="settings_container container_blue">
			<h1 class="setting_discloser">Proxy settings</h1>
			<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Timeout:</h2>

					<input class="setting_text" type="number" bind:value={data.timeout} />
				</div>

				<p class="setting_info" style="margin-bottom: 0%;">
					How much to wait before declaring proxy is nonfunctional?
				</p>
				<p class="setting_info">If set to 0 it will wait infinitely untill it resolves or errors</p>
			</div>

			<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Default proxy protocol:</h2>

					<input class="setting_text" type="string" bind:value={data.default_proxy_protocol} />
				</div>

				<p class="setting_info">Default proxy protocol to use if one isn't provided</p>
			</div>

			<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Accept all proxies:</h2>

					<input
						class="setting_button setting_checkbox"
						type="checkbox"
						bind:checked={data.disable_proxy_tests}
					/>
				</div>

				<p class="setting_info">Should the application declare all proxies as functional?</p>
			</div>

			<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Headless proxy tests:</h2>

					<input
						class="setting_button setting_checkbox"
						type="checkbox"
						bind:value={data.proxy_tests_headless}
					/>
				</div>

				<p class="setting_info">Should the proxy testers run in headless mode?</p>
			</div>
		</div>

		<p class="proxy_title setting_discloser ">Proxy list</p>

		<textarea class="setting_proxies" rows="7" value={proxies_raw} on:input={formatProxies} />

		<div class="proxy_selector_container container_{colorFromDisplay}">
			<div id="proxy_type_selector">
				<button
					class="proxy_selector_button container_yellow"
					on:click={() => (displayingProxyType = 'all')}>All</button
				>
				<button
					class="proxy_selector_button container_green"
					on:click={() => (displayingProxyType = 'good')}>Good</button
				>
				<button
					class="proxy_selector_button container_red"
					on:click={() => (displayingProxyType = 'bad')}>Bad</button
				>
			</div>

			<div
				id="proxy_display_container"
				class="proxy_selector_container container_{colorFromDisplay}"
			>
				{#if displayingProxyType == 'all'}
					<AllDisplay {good_proxies} {bad_proxies} {untested_proxies} />
				{:else if displayingProxyType == 'good'}
					<GoodDisplay {good_proxies} />
				{:else if displayingProxyType == 'bad'}
					<BadDisplay {bad_proxies} />
				{/if}
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.proxy_selector_container {
		padding: 1%;
		margin-top: 3%;
	}

	#proxy_display_container {
		overflow-y: auto;
		min-height: 400px;
		max-height: 400px;
		
		padding-top: 3%;

		margin-left: 3%;
		max-width: 97%;
	}

	#proxy_type_selector {
		margin-top: 5%;

		display: flex;
		flex-direction: row;
		width: 96%;
		margin-left: 3.5%;
		gap: 3%;
	}

	.proxy_selector_button {
		width: 100%;
		flex: 0 1 auto;
		font-size: 1.5em;
	}

	.container_blue {
		box-shadow: 0 0 12px 4px rgba(2, 71, 197, 0.952);
	}

	.container_yellow {
		box-shadow: 0 0 12px 4px rgba(238, 255, 0, 0.952);
	}

	.container_red {
		box-shadow: 0 0 12px 4px rgba(211, 20, 6, 0.856);
	}

	.container_green {
		box-shadow: 0 0 12px 4px rgba(8, 197, 24, 0.856);
	}

	.same_line {
		display: flex;
		justify-items: center;
		margin-top: 2%;
		height: 100%;
	}

	.setting_proxies {
		margin-top: 3%;
		margin-left: 5%;

		max-width: 90%;
		min-width: 90%;
		width: 90%;

		background-color: rgb(172, 176, 180);
		color: #111111;
	}

	.setting_text {
		margin-left: 5%;
		background-color: rgb(199, 203, 207);
	}

	.setting_button {
		aspect-ratio: 1.7/1;

		min-height: 0.9em;
		min-width: 0.9em;

		margin-left: 5%;

		background-color: #272c30;
	}

	.setting_checkbox {
		accent-color: #267ec5;
	}

	.setting_name {
		color: rgb(221, 216, 211);
		font-size: 0.9em;
	}
	.setting_div {
		margin: 3%;
		box-shadow: 0 0 2px 3px rgb(54, 54, 53);
	}

	.setting_discloser {
		text-align: center;
		color: rgb(238, 233, 229);
		font-size: 1.3em;
	}

	.settings_container {
		background-color: #272c30;
		padding-bottom: 2%;
		margin-bottom: 5%;
	}

	#form_container {
		padding-left: 3%;
		padding-top: 3%;
		max-width: 97%;
	}

	@media only screen and (orientation: portrait) {
		.settings_container {
			max-width: 98%;
			width: 98%;
			min-width: 98%;
		}
	}

	@media only screen and (orientation: landscape) {
		.settings_container {
			flex: 1 1 0;
		}
	}
</style>
