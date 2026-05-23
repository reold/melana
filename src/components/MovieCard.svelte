<script lang="ts">
  import Button from "./Button.svelte";
  import type { Movie } from "../lib/tmdb";

  export let movie: Movie | null = null;
  export let isSkeleton: boolean = false;

  export let onselect: (movie: Movie, rect: DOMRect) => void = () => {};
  export let onplay: (movie: Movie) => void = () => {};

  let imgEl: HTMLImageElement | undefined;

  function handlePlay(e: Event) {
    e.stopPropagation();
    if (!movie) return;
    onplay(movie);
  }

  function handleCardClick() {
    if (!movie) return;
    const rect = imgEl?.getBoundingClientRect();
    if (rect) {
      onselect(movie, rect);
    }
  }
</script>

<div
  class={`card ${isSkeleton ? "skeleton" : ""}`}
  role="button"
  tabindex={isSkeleton ? -1 : 0}
  aria-label={movie ? `View details for ${movie.title}` : "Loading"}
  on:click={handleCardClick}
  on:keydown={(e) => e.key === "Enter" && handleCardClick()}
>
  <div class="art">
    {#if !isSkeleton}
      {#if movie?.poster_path}
        <img
          bind:this={imgEl}
          src="https://image.tmdb.org/t/p/w342{movie.poster_path}"
          alt={movie.title}
        />
      {:else}
        <div class="thumb" aria-hidden="true">🎬</div>
      {/if}
    {:else}
      <div class="skeleton-art" aria-hidden="true"></div>
    {/if}
  </div>

  <div class="meta">
    {#if !isSkeleton}
      <h3>{movie?.title}</h3>
      <p class="sub">{movie?.release_date || "N/A"}</p>

      <!-- Wide play button at the bottom -->
      <button class="play-btn" on:click={handlePlay}>
        <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.14v14l11-7-11-7z" />
        </svg>
        Play
      </button>
    {:else}
      <div
        class="skeleton-line"
        style="height: 20px; width: 80%; margin-bottom: 6px;"
        aria-hidden="true"
      ></div>
      <p class="sub skeleton-line" style="width: 60%;" aria-hidden="true">
        &nbsp;
      </p>
      <div class="skeleton-btn" aria-hidden="true"></div>
    {/if}
  </div>
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-surface);
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    transition:
      transform 0.2s var(--timing-ease-out),
      box-shadow 0.2s;
    cursor: pointer;
  }

  .card:hover:not(.skeleton) {
    transform: scale(1.03);
    box-shadow: var(--shadow-elevated);
  }

  .card:active:not(.skeleton) {
    transform: scale(0.98);
  }

  .art {
    height: 280px;
    background: #2c2c2e;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumb {
    font-size: 48px;
    opacity: 0.6;
  }

  .meta {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  h3 {
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .sub {
    margin: 0 0 16px 0;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
  }

  /* Play button */
  .play-btn {
    background: var(--color-accent-green);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 10px 0;
    width: 100%;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background 0.2s;
    margin-top: auto;
  }

  .play-btn:hover {
    background: #30b94e;
  }

  .play-icon {
    width: 20px;
    height: 20px;
  }

  /* Skeleton Loading */
  .card.skeleton {
    pointer-events: none;
  }

  .skeleton-art {
    background: linear-gradient(90deg, #2c2c2e 0%, #3a3a3c 50%, #2c2c2e 100%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 2s infinite;
  }

  .skeleton-line {
    height: 12px;
    background: linear-gradient(90deg, #2c2c2e 0%, #3a3a3c 50%, #2c2c2e 100%);
    background-size: 200% 100%;
    border-radius: 6px;
    animation: skeleton-shimmer 2s infinite;
  }

  .skeleton-btn {
    height: 44px;
    background: linear-gradient(90deg, #2c2c2e 0%, #3a3a3c 50%, #2c2c2e 100%);
    background-size: 200% 100%;
    border: none;
    border-radius: 10px;
    animation: skeleton-shimmer 2s infinite;
    margin-top: auto;
  }

  @keyframes skeleton-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  @media (max-width: 480px) {
    .art {
      height: 220px;
    }
  }
</style>
