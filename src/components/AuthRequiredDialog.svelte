<script lang="ts">
  import Dialog from "./Dialog.svelte";
  import DiscordSignin from "./DiscordSignin.svelte";
  import { currentUser } from "../lib/auth";
  import { get } from "svelte/store";

  export let onclose: () => void = () => {};
  export let onsuccess: () => void = () => {};

  // When the user logs in via the popup, $currentUser becomes non‑null
  $: if ($currentUser) {
    onsuccess();
  }
</script>

<Dialog {onclose}>
  <div class="auth-dialog-content">
    <h2>Authentication Required</h2>
    <p>Please sign in with to access this content.</p>
    <div class="auth-dialog-actions">
      <DiscordSignin user={$currentUser} />
      <button class="btn-cancel" on:click={onclose}>Cancel</button>
    </div>
  </div>
</Dialog>

<style>
  .auth-dialog-content {
    text-align: center;
  }
  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
  }
  p {
    margin: 0 0 20px 0;
    font-size: 14px;
    color: var(--color-text-secondary);
  }
  .auth-dialog-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .btn-cancel {
    background: rgba(255, 255, 255, 0.1);
    -webkit-backdrop-filter: blur(10px);
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
</style>
