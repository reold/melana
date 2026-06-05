<script lang="ts">
  export let url = "";
  export let origin = ""; // no default, user must provide

  export let onplay: () => void = () => {};
  export let onclose: () => void = () => {};

  function handlePlay() {
    onplay();
  }

  function handleClose() {
    onclose();
  }
</script>

<div class="overlay" on:click={handleClose}>
  <div class="card" on:click|stopPropagation>
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
      <button class="btn-cancel" on:click={handleClose}>Cancel</button>
      <button class="btn-play" on:click={handlePlay}>Play</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(12px);
  }
  .card {
    background: var(--color-bg-surface);
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(--shadow-elevated);
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
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
    border-radius: 10px;
    border: none;
    background: var(--color-bg-elevated);
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
    border: none;
    color: var(--color-text-primary);
    border-radius: 10px;
    padding: 8px 18px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }
  .btn-play {
    background: var(--color-accent-green);
    border: none;
    color: #fff;
    border-radius: 10px;
    padding: 8px 18px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
</style>
