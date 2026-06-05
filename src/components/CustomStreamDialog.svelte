<script lang="ts">
  import Dialog from "./Dialog.svelte";

  export let url = "";
  export let origin = "";
  export let onplay: () => void = () => {};
  export let onclose: () => void = () => {};

  function handlePlay() {
    onplay();
  }
</script>

<Dialog {onclose}>
  <h2>Custom Stream</h2>
  <label>
    .m3u8 URL
    <input bind:value={url} placeholder="https://..." class="field" />
  </label>
  <label>
    Origin
    <input bind:value={origin} class="field" placeholder="https://..." />
  </label>
  <div class="actions">
    <button class="btn-cancel" on:click={onclose}>Cancel</button>
    <button class="btn-play" on:click={handlePlay}>Play</button>
  </div>
</Dialog>

<style>
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: var(--color-text-secondary);
  }
  .field {
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    color: var(--color-text-primary);
    font-size: 16px;
    outline: none;
  }
  .field:focus {
    box-shadow: 0 0 0 2px var(--color-accent-blue);
  }
  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .btn-cancel {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--color-text-primary);
    border-radius: 12px;
    padding: 8px 18px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .btn-play {
    background: linear-gradient(to bottom, var(--color-accent-green), #2ecc71);
    border: none;
    color: #fff;
    border-radius: 12px;
    padding: 8px 18px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    transition:
      transform 0.1s,
      box-shadow 0.1s;
  }
  .btn-play:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
  }
  .btn-play:active {
    transform: scale(0.97);
  }
</style>
