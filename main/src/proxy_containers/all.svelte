<script lang="ts">
    export let good_proxies: any[] = []
    export let bad_proxies: any[] = []
    export let untested_proxies: any[] = []
</script>

{#each good_proxies as proxy, index}
	<div class="container_green proxy_cointainer">
        <p class="proxy_index">#{index + 1}</p>
		<p class="proxy_url">{proxy.url}</p>
	</div>
{/each}

{#each bad_proxies as proxy, index}
	<div class="container_red proxy_cointainer">
        <p class="proxy_index">#{index + 1 + good_proxies.length}</p>
		<p class="proxy_url">{proxy.url}</p>
        <p class="proxy_error">problem: {proxy.err}</p>
	</div>
{/each}

{#each untested_proxies as proxy, index}
	<div class="container_blue proxy_cointainer">
        <p class="proxy_index">#{index + 1 + bad_proxies.length + good_proxies.length}</p>
		<p class="proxy_url">{proxy.url}</p>
	</div>
{/each}

<style lang="scss">
	.container_blue {
		box-shadow: 0 0 6px 2px rgba(18, 79, 212, 0.856);
	}

	.container_red {
		box-shadow: 0 0 6px 2px rgba(211, 20, 6, 0.856);
	}

	.container_green {
		box-shadow: 0 0 6px 2px rgba(8, 197, 24, 0.856);
	}

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
</style>
