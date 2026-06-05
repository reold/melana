<script lang="ts">
  import type { SeasonSummary } from "../lib/tmdb";

  export let season: SeasonSummary;
  export let highlight: boolean = false;
  export let onclick: () => void = () => {};

  $: episodeCount = season.episode_count ?? 0;
  $: label =
    episodeCount === 0
      ? "Episodes TBD"
      : `${episodeCount} episode${episodeCount !== 1 ? "s" : ""}`;
</script>

<div
  class="season-card"
  class:pending={episodeCount === 0}
  class:highlight
  on:click={onclick}
  role="button"
  tabindex="0"
  on:keydown={(e) => e.key === "Enter" && onclick()}
>
  <div class="season-poster">
    {#if season.poster_path}
      <img
        src={`https://image.tmdb.org/t/p/w185${season.poster_path}`}
        alt={season.name}
      />
    {:else}
      <div class="fallback-poster">
        {season.season_number === 0 ? "Specials" : `S${season.season_number}`}
      </div>
    {/if}
    {#if episodeCount === 0}
      <div class="pending-badge">TBD</div>
    {/if}
  </div>
  <div class="season-info">
    <p class="season-name">{season.name}</p>
    <p class="ep-count">{label}</p>
  </div>
</div>

<style>
  .season-card {
    width: 180px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    position: relative;
    border: 2px solid transparent;
  }
  .season-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
  }
  .season-card.pending {
    opacity: 0.7;
  }
  .season-card.pending:hover {
    opacity: 1;
  }
  .season-card.highlight {
    border-color: var(--color-accent-blue);
  }
  .season-poster {
    width: 100%;
    height: 110px;
    overflow: hidden;
    background: #2c2c2e;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .season-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .fallback-poster {
    font-size: 20px;
    color: var(--color-text-secondary);
    font-weight: 600;
  }
  .pending-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(255, 165, 0, 0.9);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .season-info {
    padding: 10px;
  }
  .season-name {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ep-count {
    font-size: 11px;
    color: var(--color-text-secondary);
    margin: 0;
  }
</style>
