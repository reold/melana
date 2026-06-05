<script lang="ts">
  import Dialog from "./Dialog.svelte";

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

<Dialog {onclose}>
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
  .btn-join {
    background: linear-gradient(to bottom, var(--color-accent-blue), #005bbf);
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
  .btn-join:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
  }
  .btn-join:active {
    transform: scale(0.97);
  }
</style>
