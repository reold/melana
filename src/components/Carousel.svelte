<script lang="ts">
  export let items: any[] = [];
  export let cardWidth: number = 180;
  export let cardGap: number = 16;
  export let key: string = "id";

  let scrollPos = 0;
  let viewport: HTMLDivElement;

  $: totalWidth = items.length * (cardWidth + cardGap) - cardGap;
  $: maxScroll = Math.max(0, totalWidth - (viewport?.clientWidth ?? 0));
  $: atStart = scrollPos <= 0;
  $: atEnd = scrollPos >= maxScroll;

  function shift(direction: number) {
    const step = cardWidth + cardGap;
    scrollPos = Math.max(0, Math.min(scrollPos + direction * step, maxScroll));
  }
</script>

<div class="carousel-wrapper">
  <button
    class="carousel-btn left"
    on:click={() => shift(-1)}
    disabled={atStart}
  >
    <svg
      class="chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  </button>
  <div
    bind:this={viewport}
    class="carousel-viewport"
    class:darken-left={!atStart}
    class:darken-right={!atEnd}
  >
    <div class="carousel-track" style="transform: translateX(-{scrollPos}px);">
      {#each items as item, index (item[key] ?? index)}
        <div
          class="carousel-item"
          style="width: {cardWidth}px; margin-right: {cardGap}px;"
        >
          <slot {item} {index} />
        </div>
      {/each}
    </div>
  </div>
  <button class="carousel-btn right" on:click={() => shift(1)} disabled={atEnd}>
    <svg
      class="chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  </button>
</div>

<style>
  .carousel-wrapper {
    display: flex;
    align-items: center;
    position: relative;
    min-width: 0;
  }
  .carousel-btn {
    background: rgba(255, 255, 255, 0.08);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
    flex-shrink: 0;
    transition:
      background 0.2s,
      box-shadow 0.2s;
    padding: 0;
  }
  .carousel-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  .carousel-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .chevron {
    width: 20px;
    height: 20px;
    display: block;
  }
  .carousel-viewport {
    flex: 1;
    overflow: hidden;
    margin: 0 8px;
    position: relative;
    min-width: 0;
  }
  .carousel-track {
    display: flex;
    transition: transform 0.3s ease;
  }
  .carousel-item {
    flex-shrink: 0;
  }
  .carousel-viewport::before,
  .carousel-viewport::after {
    content: "";
    position: absolute;
    top: 0;
    width: 40px;
    height: 100%;
    z-index: 2;
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .carousel-viewport::before {
    left: 0;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.5), transparent);
    opacity: 0;
  }
  .carousel-viewport::after {
    right: 0;
    background: linear-gradient(to left, rgba(0, 0, 0, 0.5), transparent);
    opacity: 0;
  }
  .carousel-viewport.darken-left::before {
    opacity: 1;
  }
  .carousel-viewport.darken-right::after {
    opacity: 1;
  }
</style>
