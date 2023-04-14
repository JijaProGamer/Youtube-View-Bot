<div id="local_container">
	<div id="form_container">
		<h1 id="app_title">Donation methods</h1>

		<div id="donation_methods">
			<div class="donation_holder holder">
				<a class="donation" href="https://www.patreon.com/Bloxxy213/membership">Patreon</a>
			</div>

			<div class="donation_holder holder">
				<a class="donation" href="https://www.paypal.me/bloxxywashere">Paypal</a>
			</div>

			<div class="donation_text_holder holder">
				<p class="donation_text">Bitcoin: bc1qqnv3wsfhlr4vmyqew34rkcdrll2p82hgyynq3k</p>
				<p class="donation_text">
					Monero:
					456JAvFCKFsHMThex4nqgjQpJE8LHaBtuSTFSGRgbZqwhA6giCt4DzGVxBbL3nrgAD7cdLBckMm75C8pg3nc3Yxr18HKPE1
				</p>
				<p class="donation_text">Etherum: 0x422fB1E7d4201fBD77f493fAB7F4BAE6f5f7a093</p>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	#local_container {
		width: 100%;
		height: 100%;
	}

	#app_title {
		text-align: center;
		font-size: 4em;
		color: azure;
		margin-top: 2%;
		margin-bottom: 3%;
	}

	#donation_methods {
		display: flex;
		
		align-items: center;
		justify-content: center;
		text-align: center;
		flex-direction: column;
	}

	.donation {
		display: inline-block;
		color: #f5ecec;
		background: none;
		font-size: 3em;
	}

	.donation_text:before {
		content: '\a';
		white-space: pre;
	}

	.holder {
		margin-bottom: 3%;
		margin-top: 3%;
	}

	.donation_text_holder {
		display: block;
		align-items: center;
		justify-content: center;
		min-width: 100%;
		max-width: 100%;

		background-color: #3a3a3a;
	}

	.donation_holder {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 100%;
		max-width: 100%;

		background-color: #3a3a3a;
	}
</style>
