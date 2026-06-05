<script lang="ts">
  import type { Movie } from "../lib/tmdb";

  export let movie: Movie | null = null;
  export let isSkeleton: boolean = false;
  export let active: boolean = false;
  export let onselect: (movie: Movie, rect: DOMRect) => void = () => {};
  export let onplay: (movie: Movie) => void = () => {};

  let cardEl: HTMLDivElement | undefined;

  function handlePlay(e: Event) {
    e.stopPropagation();
    if (!movie) return;
    onplay(movie);
  }

  function handleCardClick() {
    if (!movie || isSkeleton) return;
    const artEl = cardEl?.querySelector(".art");
    const rect = artEl?.getBoundingClientRect();
    if (rect) {
      onselect(movie, rect);
    }
  }
</script>

<div
  bind:this={cardEl}
  class="card {isSkeleton ? 'skeleton' : ''}"
  class:active
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
          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
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
      <div class="sub-row">
        <span class="rating">
          <svg class="star-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
            />
          </svg>
          {movie?.vote_average?.toFixed(1) ?? "N/A"}
        </span>
        <span class="separator">•</span>
        <span class="date">{movie?.release_date || "N/A"}</span>
      </div>
      <button class="play-btn" on:click={handlePlay}>Play</button>
    {:else}
      <div
        class="skeleton-line"
        style="height: 20px; width: 80%; margin-bottom: 6px;"
      ></div>
      <div class="skeleton-btn"></div>
    {/if}
  </div>
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    transition:
      transform 0.2s var(--timing-ease-out),
      box-shadow 0.2s,
      opacity 0.2s;
    cursor: pointer;
  }

  .card.active {
    opacity: 0;
    pointer-events: none;
    transform: scale(1.03);
  }

  .card:hover:not(.skeleton):not(.active) {
    transform: scale(1.03);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.8);
  }

  .card:active:not(.skeleton):not(.active) {
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
    border-radius: 12px 12px 0 0;
  }

  .art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
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
    position: relative;
    z-index: 1;
  }

  h3 {
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .sub-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 3px;
    color: var(--color-accent-orange);
    font-weight: 600;
  }

  .star-icon {
    width: 14px;
    height: 14px;
    color: var(--color-accent-orange);
    flex-shrink: 0;
  }

  .separator {
    color: var(--color-text-tertiary);
    opacity: 0.5;
  }

  .date {
    color: var(--color-text-secondary);
  }

  .play-btn {
    background: linear-gradient(to bottom, var(--color-accent-green), #2ecc71);
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 10px 0;
    width: 100%;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition:
      background 0.2s,
      transform 0.1s;
    margin-top: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .play-btn:hover {
    background: linear-gradient(to bottom, #30b94e, #28a745);
  }

  .play-btn:active {
    transform: scale(0.97);
  }

  .play-icon {
    width: 20px;
    height: 20px;
  }

  .card.skeleton {
    pointer-events: none;
    background: rgba(255, 255, 255, 0.05);
  }

  .skeleton-art {
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 100%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 2s infinite;
  }

  .skeleton-line {
    height: 12px;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 100%
    );
    background-size: 200% 100%;
    border-radius: 6px;
    animation: skeleton-shimmer 2s infinite;
    display: block;
    margin-bottom: 6px;
  }

  .skeleton-btn {
    height: 44px;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 100%
    );
    background-size: 200% 100%;
    border: none;
    border-radius: 12px;
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
