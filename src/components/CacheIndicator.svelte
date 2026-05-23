<script lang="ts">
  import { afterUpdate } from "svelte";
  import CacheChart from "./CacheChart.svelte";
  import type { HealthInfo } from "../lib/proxy";

  export let healthInfo: HealthInfo | null = null;
  export let cacheJustUpdated: boolean = false;
  export let loading: boolean = false;

  let showPopup = false;
  let buttonEl: HTMLDivElement;

  $: isCritical = (healthInfo?.cache.utilization_percent ?? 0) >= 90;
  $: isDisabled = loading || !healthInfo;

  // Shine animation on cache update
  afterUpdate(() => {
    if (cacheJustUpdated && buttonEl) {
      buttonEl.animate(
        [
          { boxShadow: "0 0 10px rgba(255,243,51,0.6)" },
          { boxShadow: "0 0 0 rgba(255,243,51,0)" },
        ],
        { duration: 500, easing: "ease-out" },
      );
    }
  });
</script>

<div class="cache-indicator" bind:this={buttonEl}>
  <button
    class:loading={isDisabled}
    class="cache-btn"
    disabled={isDisabled}
    title={isDisabled
      ? "Proxy server is starting. Render cold starts can take a few minutes."
      : "Cache usage"}
    on:mouseenter={() => {
      if (!isDisabled) showPopup = true;
    }}
    on:mouseleave={() => (showPopup = false)}
  >
    <span class="cache-icon">
      {#if isDisabled}
        <span class="spinner" aria-hidden="true"></span>
      {:else}
        {#if isCritical}
          <svg
            class="critical-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff2d55"
            stroke-width="2"
          >
            <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {/if}

        <svg
          class="chart-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 21H3V3m18 0l-8 8-4-4-4 4" />
        </svg>
      {/if}
    </span>

    <span class="cache-text">
      {#if isDisabled}
        Starting…
      {:else}
        {healthInfo.cache.utilization_percent.toFixed(0)}%
      {/if}
    </span>
  </button>

  {#if showPopup && healthInfo}
    <div class="cache-popup">
      <CacheChart {healthInfo} />
    </div>
  {/if}
</div>

<style>
  .cache-indicator {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .cache-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition:
      background 0.2s,
      opacity 0.2s;
    position: relative;
  }

  .cache-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  .cache-btn:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .cache-btn.loading {
    color: var(--color-text-secondary);
  }

  .cache-icon {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .critical-icon {
    width: 14px;
    height: 14px;
  }

  .chart-icon {
    width: 16px;
    height: 16px;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-top-color: var(--color-accent-blue);
    animation: spin 0.8s linear infinite;
  }

  .cache-text {
    font-weight: 600;
  }

  .cache-popup {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    z-index: 999;
    padding: 0;
    background: none;
    box-shadow: none;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
