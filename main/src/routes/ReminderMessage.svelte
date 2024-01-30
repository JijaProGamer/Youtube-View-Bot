<script lang="ts">
    export let showMessage = false;
    export let title = '';
    export let image = '';
    export let text = '';
    export let button1Text = '';
    export let button2Text = '';
    export let button3Text = '';

    export let onDecision = (buttonIndex: any) => {}
    export let onClose = () => {}

    function closePanel(){
        showMessage = false;
        onClose()
    }
    
</script>
  
<style>
    .message-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #333;
        color: #fff;
        padding: 20px;
        border: 1px solid #555;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        z-index: 999;
        text-align: center;
    }

    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        z-index: 500;
    }

    .message-title {
        font-size: 2.5em;
        margin-bottom: 100px;
        color: #cac3c3;
    }

    .message-text {
        font-size: 1.5em;
        margin-bottom: 5px;
    }

    .message-image {
        width: 80%;
        margin-left: 10%;
        aspect-ratio: 1/1;

        margin-top: 5%;
        margin-bottom: 5%;
    }

    .message-button1,
    .message-button2 {
        color: #fff;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1.2em;
        margin-top: 20px;
    }

    .message-button1 {
        background-color: rgb(209, 35, 35);
    }

    .message-button1:hover {
        background-color: #9c3030;
    }

    .message-button2 {
        background-color: #3ab640;
    }

    .message-button2:hover {
        background-color: #71cc76;
    }
</style>

{#if showMessage}
    <div class="overlay"></div>

    <div class="message-container">
        <h class="message-title">{@html title}</h>
        <img class="message-image" src="{image}" alt="Message image">

        {#each text.split("\n") as line}
            <p class="message-text">{@html line}</p>
        {/each}

        <button class="message-button1" on:click={() => {closePanel(); onDecision(1)}}>{button1Text}</button>
        <button class="message-button1" on:click={() => {closePanel(); onDecision(2)}}>{button2Text}</button>
        <button class="message-button2" on:click={() => {closePanel(); onDecision(3)}}>{button3Text}</button>
    </div>
{/if}