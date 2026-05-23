<script lang="ts">
  export let onclose: () => void = () => {};
  export let onjoin: (username: string, roomId: string) => void = () => {};

  let username = "";
  let roomId = "";

  function handleSubmit() {
    if (username.trim() && roomId.trim()) {
      onjoin(username.trim(), roomId.trim());
    }
  }
</script>

<div class="overlay" on:click={onclose}>
  <div class="card" on:click|stopPropagation>
    <h2>Join Sync Room</h2>
    <label>
      Your Name
      <input
        bind:value={username}
        placeholder="Your nickname"
        maxlength="32"
        class="field"
      />
    </label>
    <label>
      Room ID
      <input bind:value={roomId} placeholder="Room ID" class="field" />
    </label>
    <div class="actions">
      <button class="btn-cancel" on:click={onclose}>Cancel</button>
      <button class="btn-join" on:click={handleSubmit}>Join</button>
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
    font-size: 14px;
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
  .btn-join {
    background: var(--color-accent-blue);
    border: none;
    color: #fff;
    border-radius: 10px;
    padding: 8px 18px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
</style>
