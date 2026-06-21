<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  export let label: string = "";
  export let showMenu: boolean = false;

  let wrapper: HTMLDivElement;

  function handleClickOutside(e: MouseEvent) {
    if (wrapper && !wrapper.contains(e.target as Node)) {
      showMenu = false;
    }
  }

  onMount(() => document.addEventListener("click", handleClickOutside));
  onDestroy(() => document.removeEventListener("click", handleClickOutside));

  function toggle() {
    showMenu = !showMenu;
  }
</script>

<div class="dropdown-wrapper" bind:this={wrapper}>
  <button class="dropdown-btn" on:click={toggle}>
    {label}
    <svg
      class="chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  </button>
  {#if showMenu}
    <div class="dropdown-menu">
      <slot />
    </div>
  {/if}
</div>

<style>
  .dropdown-wrapper {
    position: relative;
  }
  .dropdown-btn {
    background: rgba(255, 255, 255, 0.08);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--color-text-primary);
    border-radius: 12px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition:
      background 0.2s,
      box-shadow 0.2s;
  }
  .dropdown-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  .chevron {
    width: 16px;
    height: 16px;
  }
  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    background: rgba(255, 255, 255, 0.1);
    -webkit-backdrop-filter: blur(30px);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    min-width: 140px;
    max-height: 240px;
    overflow-y: auto;
    z-index: 50;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
  }
</style>
