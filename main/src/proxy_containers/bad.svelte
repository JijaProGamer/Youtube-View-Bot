<script lang="ts">
	export let bad_proxies: any[] = [];
</script>

{#each bad_proxies as proxy, index}
	<div class="container_gray proxy_cointainer">
        <p class="proxy_index">#{index + 1}</p>
		<p class="proxy_url">{proxy.url}</p>
        <p class="proxy_error">problem: {proxy.err}</p>
	</div>
{/each}

<style lang="scss">
    .proxy_index {
        margin-left: 1.5%;
        color: rgb(236, 243, 250);
    }

    .proxy_url {
        margin-left: 6%;
        color: rgb(236, 243, 250)
    }

    .proxy_error {
        margin-left: 6%;
        color: rgb(221, 17, 17)
    }

    .proxy_cointainer {
        margin-bottom: 3%;
        margin-left: 3%;
        max-width: 94%;
    }
	.container_gray {
		box-shadow: 0 0 6px 2px rgba(255, 253, 253, 0.973);
	}

</style>
