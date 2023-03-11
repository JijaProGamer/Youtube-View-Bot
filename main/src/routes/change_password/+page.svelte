<script lang="ts">
	import axios from 'axios';

	let password1 = '';
	let password2 = '';
	$: disabled = password1 !== password2;

	function publishPassword() {
		axios
			.post('/api/change_password', { password: password1 })
			.then((res) => {
				if(password1.trim().length > 0)
					return window.location.href = '/login'

				window.location.href = '/'
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
			<h2 class="info_text">Please choose a password</h2>
			<h3 class="info_text">
				if you open this server to the internet then please chose a secure password.
			</h3>
			<h3 class="info_text">If not, then you can use a empty password.</h3>

			<input type="password" id="password1" class="input_password" bind:value={password1} />

			<h3 class="info_text">Retype your password</h3>

			<input type="password" id="password2" bind:value={password2} />

			<button id="login" {disabled} on:click|preventDefault={publishPassword}>Set password</button>
		</form>

		<div id="extra_holder">
			<a class="extra_options" href="https://github.com/JijaProGamer/Youtube-View-Bot/wiki">Docs</a>
			<a class="extra_options" href="https://github.com/JijaProGamer/Youtube-View-Bot">Github</a>
			<a class="extra_options" href="https://discord.gg/QRUafDAqHz">Discord</a>
		</div>

		<div id="donation_holder">
			<a class="donation" href="https://www.paypal.me/bloxxywashere"
				>❤️ Donate if you found this useful ❤️</a
			>
		</div>
	</div>
</div>

<style lang="scss">
	.info_text {
		color: #e8ebee;
	}

	#form_container {
		max-width: 65%;
		width: 65%;
		border: 3px solid;
		background-color: #272c30;
		border-radius: 25px;
	}

	#local_container {
		display: flex;
		padding-top: 5vh;

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

	#password1 {
		width: 80%;
		font-size: 2em;
		margin-left: 10%;
	}

	#password2 {
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
		margin-bottom: 5%;
		text-align: center;
		color: rgb(247, 247, 247);
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
