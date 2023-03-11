<script lang="ts">
	import axios from 'axios';

	let password = '';
	$: disabled = password.length <= 0;

	axios.get("/api/health").then(() => {
		window.location.href = "/"
	})
	.catch(() => {})

	function publishPassword() {
		axios
			.post('/api/login', { password })
			.then((res) => {
				window.location.href = '/';
			})
			.catch((err) => {
				console.log(err);
			});
	}
</script>

<div id="local_container">
	<div id="form_container">
		<img src="/images/modal.png" id="modal" alt="modal" />
		<h1 id="app_title">YOUTUBE VIEW BOT</h1>

		<form>
			<input placeholder="Password" type="password" id="input_password" bind:value={password} />

			<button id="login" {disabled} on:click|preventDefault={publishPassword}>Login</button>
		</form>

		<div id="extra_holder">
			<a class="extra_options" href="https://github.com/JijaProGamer/Youtube-View-Bot/wiki">Docs</a>
			<a class="extra_options" href="https://github.com/JijaProGamer/Youtube-View-Bot">Github</a>
			<a class="extra_options" href="https://discord.gg/QRUafDAqHz">Discord</a>
		</div>

		<div id="donation_holder">
			<a class="donation" href="https://www.patreon.com/Bloxxy213/membership"
				>❤️ Donate if you found this useful ❤️</a
			>
		</div>
	</div>
</div>

<style lang="scss">
	#form_container {
		max-width: 75%;
		width: 75%;
		border: 3px solid;
		background-color: #272c30;
		border-radius: 25px;
	}

	#local_container {
		display: flex;
		padding-top: 10vh;

		text-align: center;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	@media only screen and (orientation: portrait) {
		#form_container {
			max-width: 95%;
			width: 95%;
		}
	}

	#input_password {
		width: 80%;
		font-size: 2em;
		margin-left: 10%;
	}

	#login {
		margin-top: 2%;
		width: 70%;
		margin-left: 15%;
		font-size: 1.7em;
	}

	#app_title {
		text-align: center;
		color: rgb(247, 247, 247);
		margin-bottom: 5%;
	}

	.extra_options {
		margin-left: 5%;
		display: inline-block;
		margin-top: 2%;
	}

	.donation {
		display: inline-block;
		margin-top: 7%;
		margin-bottom: 3%;
	}

	#modal {
		width: 70%;
		margin-top: 3%;
		margin-left: 15%;
		height: 70%;
	}

	#extra_holder,
	#donation_holder {
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
