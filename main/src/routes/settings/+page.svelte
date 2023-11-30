<script lang="ts">
	import Slider from '@bulatdashiev/svelte-slider';
	import { opts, dataChanged, newData } from '../../background.js';
	let data = opts;
	dataChanged((newData: any) => (data = newData));
	$: newData(data);

	$: changePort(data.server_port);
	$: changeAPIKey(data.api_key);

	function changePort(newPort: number) {
		if (newPort < 1024) {
			data.server_port = 1024;
		}

		if (newPort > 65535) {
			data.server_port = 65535;
		}
	}

	function changeAPIKey(newAPIKey: string) {
		data.api_key = newAPIKey;
	}
</script>

<div id="form_container">
	<div id="first_settings_tab">
		<div class="settings_container container_orange">
			<h1 class="setting_discloser">Program settings</h1>
			<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Server port:</h2>

					<input
						class="setting_text"
						type="number"
						min="1024"
						max="65535"
						bind:value={data.server_port}
					/>
				</div>

				<p class="setting_info">What port should this server use? (Restart to apply)</p>
			</div>

			<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Close server on finish:</h2>

					<input
						class="setting_button setting_checkbox"
						type="checkbox"
						bind:checked={data.close_server_on_finish}
					/>
				</div>

				<p class="setting_info">
					Should the application close by itself after it finishes working?
				</p>
			</div>

			<!--<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Chrome path:</h2>

					<input class="setting_text" type="text" bind:value={data.chromePath} />
				</div>

				<p class="setting_info">Path to a chrome/chromium executable</p>
			</div>-->

			<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Concurrency:</h2>

					<input class="setting_text" type="number" bind:value={data.concurrency} />
				</div>

				<p class="setting_info">The maximum amount of workers at the same time</p>
			</div>

			<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Concurrency interval:</h2>

					<input class="setting_text" type="number" bind:value={data.concurrencyInterval} />
				</div>

				<p class="setting_info">How much to wait between spawning workers in seconds</p>
			</div>

			<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Stop spawning workers on overload:</h2>

					<input
						class="setting_button setting_checkbox"
						type="checkbox"
						bind:checked={data.stop_spawning_on_overload}
					/>
				</div>

				<p class="setting_info">Should it stop spawning workers when RAM/CPU is at 95%?</p>
			</div>
		</div>

		<div class="settings_container container_red">
			<h1 class="setting_discloser">Worker settings</h1>

			<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Headless:</h2>

					<input
						class="setting_button setting_checkbox"
						type="checkbox"
						bind:checked={data.headless}
					/>
				</div>

				<p class="setting_info">Should the workers be invisible (Lower CPU/RAM usage)?</p>
			</div>


			<div class="setting_div">
				<div class="same_line">
					<h2 class="setting_name">Auto skip ads:</h2>

					<input
						class="setting_button setting_checkbox"
						type="checkbox"
						bind:checked={data.auto_skip_ads}
					/>
				</div>

				<p class="setting_info">Should the workers automatically skip all ads?</p>
			</div>

			{#if !data.auto_skip_ads}
				<div class="setting_div">
					<div class="same_line">
						<h2 class="setting_name">Skip ads after (percent):</h2>

						<Slider max="100" min="15" bind:value={data.skip_ads_after} range order />
					</div>

					<p class="setting_info">After what percent to skip ads?</p>
				</div>

				<div class="setting_div">
					<div class="same_line">
						<h2 class="setting_name">Skip ads after (max seconds):</h2>

						<input class="setting_text" type="number" bind:value={data.max_seconds_ads} />
					</div>

					<p class="setting_info">After how many seconds to forcefully skip?</p>
				</div>
			{/if}
		</div>
	</div>

	<div id="first_settings_tab">
		<div class="settings_container container_rainbow">
			<div class="setting_div">
				<div class="same_line premium_title">
					<h2 class="setting_name">Full feature access</h2>
				</div>

				<div class="same_line premium_line">
					<p>
						Subscribe to our patreon with a subscription of minimum 10 dollars per month for full
						feature access.
					</p>
				</div>

				<div class="same_line premium_line">
					<p>
						To get access to the full list of features, make an account on <a
							href="https://www.bloxxy.net/account">our website</a
						>, log in with your patreon and make a 10$ subscription on our
						<a href="https://www.patreon.com/Bloxxy213/membership">patreon</a>.
					</p>
				</div>

				<div class="same_line premium_line">
					<p>
						After making a account and logging in with your patreon, copy your API Key and paste it
						here:
					</p>

					<input type="text" class="premium_textbox" bind:value={data.api_key}/>
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.premium_title {
		display: flex;
		align-items: center;
		flex-direction: row;
		justify-content: center;

		margin-top: 3%;
		font-size: 2em;

		box-shadow: 0 0 0 3px rgb(54, 54, 53);
	}

	.premium_textbox {
		background-color: rgb(199, 203, 207);
		color: #232224;

		margin-left: 1%;
	}

	.premium_line {
		color: rgb(207, 211, 216);
		font-size: 1em;

		display: flex;
		align-items: center;
		flex-direction: row;
		justify-content: center;
	}

	.setting_info {
		font-size: 0.8em;
		color: rgb(178, 186, 194);
		margin-bottom: 2%;
		margin-top: 1%;
	}

	.same_line {
		display: flex;
		justify-items: center;
		margin-top: 2%;
		height: 100%;
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

	.container_orange {
		box-shadow: 0 0 6px 2px rgba(233, 126, 5, 0.856);
	}

	.container_red {
		box-shadow: 0 0 6px 2px rgba(233, 20, 5, 0.856);
	}

	.container_rainbow {
		animation: rainbow-shadow 3s infinite linear;
		border-radius: 5%;

	}

	@keyframes rainbow-shadow {
		0%, 100% {
			box-shadow: 0 0 5px #ff0000, 0 0 10px #ff7f00, 0 0 15px #ffff00, 0 0 20px #00ff00,
				0 0 25px #0000ff, 0 0 30px #4b0082, 0 0 35px #9400d3;
		}
		25% {
			box-shadow: 0 0 35px #9400d3, 0 0 5px #ff0000, 0 0 10px #ff7f00, 0 0 15px #ffff00, 0 0 20px #00ff00,
				0 0 25px #0000ff, 0 0 30px #4b0082;
		}
		50% {
			box-shadow: 0 0 30px #4b0082, 0 0 35px #9400d3, 0 0 5px #ff0000, 0 0 10px #ff7f00, 0 0 15px #ffff00, 0 0 20px #00ff00,
				0 0 25px #0000ff;
		}
		75% {
			box-shadow: 0 0 25px #0000ff, 0 0 30px #4b0082, 0 0 35px #9400d3, 0 0 5px #ff0000, 0 0 10px #ff7f00, 0 0 15px #ffff00, 0 0 20px #00ff00;
		}
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
		#first_settings_tab {
			display: flex;
			align-items: center;
			flex-direction: row;
			gap: 5%;
		}

		.settings_container {
			flex: 1 1 0;
		}
	}
</style>
