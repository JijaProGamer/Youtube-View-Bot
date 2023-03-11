<script lang="ts">
	import axios from 'axios';
	import { opts, dataChanged, newData, socket } from '../../background.js';

	let extensions: any[] = [];

	axios
		.get('/api/view_extensions')
		.then((data) => {
			extensions = data.data;
		})
		.catch(() => {});
</script>

<div class="form_container">
	{#each extensions as extension, index}
		<a class="container_gray extension_container" href="/extension/{extension.eid}">
			<p class="extension_name">{extension.name}</p>
			<p class="extension_description">{extension.description}</p>
		</a>
	{/each}
</div>

<style lang="scss">
	.extension_description {
		margin-left: 5%;
		margin-top: 3%;

		font-size: 1.25em;
		color: azure;
	}

	.extension_name {
		margin-left: 2%;

		font-size: 2em;
		color: lightgray;
	}

	.extension_container:hover {
		background-image: linear-gradient(rgb(0 0 0/40%) 0 0);
	}

	.extension_container {
		max-width: 94%;
		min-width: 94%;

		padding-bottom: 1%;
		padding-top: 1%;
		padding-right: 1%;
		padding-left: 1%;
		margin-left: 4%;

		margin-top: 2%;
		margin-bottom: 3%;
		display: inline-block;

		background-color: #272c30;
	}

	.container_gray {
		box-shadow: 0 0 8px 3px rgba(0, 0, 0, 0.952);
	}

	@media only screen and (orientation: portrait) {
		.extension_container {
			max-width: 97%;
			min-width: 97%;

			margin-left: 1.5%;
		}
	}
</style>
